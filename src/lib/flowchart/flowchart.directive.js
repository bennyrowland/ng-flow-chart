/**
 * Created by ben on 06/12/15.
 */
angular.module('flowchart')
    .directive('ngFlowChart', ['flowLibrary', 'viewmodel', 'dragging', '$uibModal', function(flowLibrary, viewmodel, dragging, $uibModal) {
        return {
            restrict: 'E',
            scope: {
                graphSpec: '='
            },
            link: function (scope, element, attrs) {
                if (scope.graphSpec === undefined) {
                    scope.graphSpec = {
                        processes: [],
                        connections: []
                    };
                }
                scope.graph = new viewmodel.ChartViewModel(scope.graphSpec);

                scope.$watch('graphSpec', function (newValue, oldValue) {
                    scope.graph = new viewmodel.ChartViewModel(scope.graphSpec);

                    // the graph needs to know the size of the viewing window in order to position the
                    // inport and outport processes at the edges of the view
                    scope.graph.inports.data.metadata.y = (scope.elementHeight() - scope.inportsHeight()) / 2.0;
                    scope.graph.outports.data.metadata.x = (scope.elementWidth() - scope.graph.outports.width());
                    scope.graph.outports.data.metadata.y = (scope.elementHeight() - scope.outportsHeight()) / 2.0;
                }, true);

                scope.editInportsOutports = function () {
                    /*scope.graph.addInport({
                        name: "inport"
                    });*/
                    console.log(scope.graph.inports.outports);
                    $uibModal.open({
                        animation: true,
                        templateUrl: "flowchart/ports.template.html",
                        scope: scope
                    });
                };

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

                scope.elementHeight = function() {
                    return element[0].offsetHeight;
                };

                scope.elementWidth = function() {
                    return element[0].offsetWidth;
                };

                scope.inportsHeight = function() {
                    return scope.graph.inports.height();
                };

                scope.outportsHeight = function() {
                    return scope.graph.outports.height();
                };

                scope.roundedRectPath = function(width, height, r0, r1, r2, r3) {
                    return 'M' + r0 + ' 0 l' + (width - r0 - r1) + ' 0 a' + r1 + ' ' + r1 + ' 0 0 1 ' + r1 + ' ' + r1 + ' l 0 ' + (height - r1 - r2) + 'a-' + r2 + ' ' + r2 + ' 0 0 1 -' + r2 + ' ' + r2 + 'l-' + (width - r2 - r3) + ' 0 a-' + r3 + ' -' + r3 + ' 0 0 1 -' + r3 + ' -' + r3 + 'l0 -' + (height - r3 - r0) + 'a' + r0 + ' -' + r0 + ' 0 0 1 ' + r0 + ' -' + r0 + 'Z';
                };

                scope.$watch(function() { return element[0].offsetWidth; }, function (newValue, oldValue) {
                    scope.graph.outports.data.metadata.x = newValue - scope.graph.outports.width();
                });

                scope.graph.inports.data.metadata.y = (scope.elementHeight() - scope.inportsHeight()) / 2.0;
                scope.graph.outports.data.metadata.x = (scope.elementWidth() - scope.graph.outports.width());
                scope.graph.outports.data.metadata.y = (scope.elementHeight() - scope.outportsHeight()) / 2.0;
            },
            templateUrl: "flowchart/flowchart.template.html",
            replace: true
        };
    }]);