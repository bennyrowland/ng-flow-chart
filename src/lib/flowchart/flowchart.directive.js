/**
 * Created by ben on 06/12/15.
 */
angular.module('flowchart')
    .directive('ngFlowChart', ['flowLibrary', 'viewmodel', 'dragging', function(flowLibrary, viewmodel, dragging) {
        return {
            restrict: 'E',
            scope: {
                chart: '='
            },
            link: function (scope, element, attrs) {
                scope.graph = new viewmodel.ChartViewModel(scope.chart);

                console.log(scope.graph);

                var svgElem = element;
                scope.draggingConnection = false;

                var hasClass = function (elem, name) {
                    return new RegExp('(\\s|^)' + name + '(\\s|$)').test(elem.attr('class'));
                };

                var addClass = function (elem, name) {
                    if(!hasClass(elem, name)) {
                        elem.attr('class', (!!elem.attr('class') ? elem.attr('class') + ' ' : '') + name);
                    }
                };

                var removeClass = function (elem, name) {
                    var remove = elem.getAttribute('class').replace(new RegExp('(\\s|^)' + name + '(\\s|$)', 'g'), '$2');
                    if (hasClass(elem, name)) {
                        elem.attr('class', remove);
                    }
                };

                var translateCoordinates = function(x, y, evt) {
                    var matrix = svgElem[0].getScreenCTM();
                    var point = svgElem[0].createSVGPoint();
                    point.x = x - evt.view.pageXOffset;
                    point.y = y - evt.view.pageYOffset;
                    return point.matrixTransform(matrix.inverse());
                };

                var searchUp = function (element, searchClass) {
                    // check if we reached the root element
                    if (element === null || element.length === 0) {
                        return null;
                    }
                    if (hasClass(element, searchClass)) {
                        return element;
                    }
                    return searchUp(element.parent(), searchClass);
                };

                scope.calculatePath = function(srcX, srcY, tgtX, tgtY) {
                    return "M " + srcX + " " + srcY + " L " + tgtX + " " + tgtY;
                };

                scope.mouseMove = function($event) {
                    // find the element the mouse is currently over
                    var mouseElement = angular.element(document.elementFromPoint($event.clientX, $event.clientY));
                    scope.mouseOverConnector = null;
                    /*
                    if (searchUp(mouseElement, "connection") !== null) {
                        console.log("is part of a connection");
                    }*/
                    var connector = searchUp(mouseElement, "connector");
                    if (connector !== null) {
                        scope.mouseOverConnector = connector.scope().connector;
                        return; // the mouse is over a connector, don't need to check anything else
                    }
                    var node = searchUp(mouseElement, "node");
                };

                scope.chartMouseDown = function($event) {
                    console.log($event);
                };

                scope.nodeMouseDown = function($event, node) {
                    console.log("mouse down on node");
                    var lastMouseCoords;

                    dragging.startDrag($event, {
                        dragStarted: function(x, y) {
                            lastMouseCoords = translateCoordinates(x, y, $event);
                            console.log("starting drag at " + lastMouseCoords.x + ", " + lastMouseCoords.y);
                        },
                        dragging: function(x, y) {
                            var curMouseCoords = translateCoordinates(x, y, $event);
                            var deltaX = curMouseCoords.x - lastMouseCoords.x;
                            var deltaY = curMouseCoords.y - lastMouseCoords.y;
                            node.data.metadata.x += deltaX;
                            node.data.metadata.y += deltaY;
                            lastMouseCoords = curMouseCoords;
                        }
                    });
                };

                scope.connectorMouseDown = function(connector, $event) {
                    var currentMouseCoords;
                    dragging.startDrag($event, {
                        dragStarted: function(x, y) {
                            scope.draggingConnection = true;
                            currentMouseCoords = translateCoordinates(x, y, $event);
                            if (connector.isInport()) {
                                scope.draggingConnectionPath = scope.calculatePath(currentMouseCoords.x, currentMouseCoords.y, connector.parentNode.data.metadata.x + connector.x, connector.parentNode.data.metadata.y + connector.y);
                            }
                            else {
                                scope.draggingConnectionPath = scope.calculatePath(connector.parentNode.data.metadata.x + connector.x, connector.parentNode.data.metadata.y + connector.y, currentMouseCoords.x, currentMouseCoords.y);
                            }
                        },
                        dragging: function(x, y) {
                            currentMouseCoords = translateCoordinates(x, y, $event);
                            if (connector.isInport()) {
                                scope.draggingConnectionPath = scope.calculatePath(currentMouseCoords.x, currentMouseCoords.y, connector.parentNode.data.metadata.x + connector.x, connector.parentNode.data.metadata.y + connector.y);
                            }
                            else {
                                scope.draggingConnectionPath = scope.calculatePath(connector.parentNode.data.metadata.x + connector.x, connector.parentNode.data.metadata.y + connector.y, currentMouseCoords.x, currentMouseCoords.y);
                            }
                            scope.draggingConnectionTarget = {x: currentMouseCoords.x, y: currentMouseCoords.y};
                            scope.draggingConnectionSource = {x: connector.parentNode.data.metadata.x + connector.x, y: connector.parentNode.data.metadata.y + connector.y};
                            scope.draggingConnectionCanDrop = scope.graph.canConnect(connector, scope.mouseOverConnector);
                            if (scope.draggingConnectionCanDrop) {
                                scope.draggingConnectionTarget = {x: scope.mouseOverConnector.parentNode.data.metadata.x + scope.mouseOverConnector.x, y: scope.mouseOverConnector.parentNode.data.metadata.y + scope.mouseOverConnector.y};
                            }
                        },
                        dragEnded: function() {
                            scope.draggingConnection = false;
                            if (scope.draggingConnectionCanDrop) {
                                if (connector.isInport()) {
                                    scope.graph.addConnection(connector, scope.mouseOverConnector);
                                }
                                else {
                                    scope.graph.addConnection(scope.mouseOverConnector, connector);
                                }
                            }
                        },
                        clicked: function() {
                            if (connector.isInport()) {
                                scope.graph.addDataConnection("data", connector);
                            }
                        }
                    });
                };

                scope.deleteConnection = function (connection) {
                    console.log(connection);
                    scope.graph.deleteConnection(connection);
                };

                scope.deleteProcess = function(process) {
                    scope.graph.deleteProcess(process);
                };

                scope.mouseScroll = function($event, $delta, $deltaX, $deltaY) {

                };

                scope.processDrop = function ($event, $data, $channel) {
                    var location = translateCoordinates($event.clientX, $event.clientY, $event);
                    console.log("A new process " + $data + " was dropped at " + location.x + ' ' + location.y);
                    this.graph.addProcess($data, {x: location.x, y: location.y});
                };
            },
            templateUrl: "flowchart/flowchart.template.html",
            replace: true
        };
    }]);