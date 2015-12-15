/**
 * Created by ben on 09/12/15.
 */

angular.module('flowchart')
    .factory('viewmodel', ['flowLibrary', function(flowLibrary) {
        var viewModelFunctions = {};

        viewModelFunctions.defaultNodeWidth = 200;
        viewModelFunctions.nodeTitleHeight = 40;
        viewModelFunctions.nodeConnectorHeight = 20;

        viewModelFunctions.computeConnectorY = function (connectorIndex) {
            return viewModelFunctions.nodeTitleHeight + (connectorIndex * viewModelFunctions.nodeConnectorHeight);
        };

        viewModelFunctions.ConnectorViewModel = function(connectorDataModel, x, y, parentNode) {
            this.data = connectorDataModel;
            this.parentNode = parentNode;
            this.x = x;
            this.y = y;
            this.isInport = function() { return this.x < 10; };
        };

        var createConnectorsViewModel = function(connectorDataModels, x, parentNode) {
            var viewModels = [];
            if (connectorDataModels) {
                for (var i = 0; i < connectorDataModels.length; ++i) {
                    var connectorViewModel = new viewModelFunctions.ConnectorViewModel(connectorDataModels[i], x, viewModelFunctions.computeConnectorY(i), parentNode);
                    viewModels.push(connectorViewModel);
                }
            }
            return viewModels;
        };

        viewModelFunctions.NodeViewModel = function (id, nodeDataModel) {
            this.id = id;
            this.data = nodeDataModel;
            this.template = flowLibrary.getComponentSchema(this.data.component);

            this.inports = createConnectorsViewModel(this.template.inports, 0, this);
            this.outports = createConnectorsViewModel(this.template.outports, viewModelFunctions.defaultNodeWidth, this);

            this.width = function() { return viewModelFunctions.defaultNodeWidth; };
            this.height = function() {
                var numConnectorRows = Math.max(this.inports.length, this.outports.length);
                return viewModelFunctions.computeConnectorY(numConnectorRows);
            };

            this.getInport = function(name) {
                for (var i = 0; i < this.inports.length; ++i) {
                    if (this.inports[i].data === name) {
                        return this.inports[i];
                    }
                }
            };

            this.getOutport = function(name) {
                for (var i = 0; i < this.outports.length; ++i) {
                    if (this.outports[i].data === name) {
                        return this.outports[i];
                    }
                }
            };

            this.selected = false;
        };

        var createNodesViewModel = function(nodesDataModel) {
            var nodesViewModel = {};

            if (nodesDataModel) {
                for (var key in nodesDataModel) {
                    if (nodesDataModel.hasOwnProperty(key)) {
                        nodesViewModel[key] = (new viewModelFunctions.NodeViewModel(key, nodesDataModel[key]));
                    }
                }
            }

            return nodesViewModel;
        };

        viewModelFunctions.ConnectionViewModel = function(connectionDataModel, outport, inport) {
            this.data = connectionDataModel;
            this.outport = outport;
            this.inport = inport;

            this.hasData = function() { return 'data' in this.data; };

            this.targetX = function() { return this.inport.parentNode.data.metadata.x + this.inport.x; };
            this.targetY = function() { return this.inport.parentNode.data.metadata.y + this.inport.y; };

            if (!this.hasData()) {
                this.sourceX = function () {
                    return this.outport.parentNode.data.metadata.x + this.outport.x;
                };
                this.sourceY = function () {
                    return this.outport.parentNode.data.metadata.y + this.outport.y;
                };
                this.midpointX = function() { return (this.sourceX() + this.targetX()) / 2.0; };
                this.midpointY = function() { return (this.sourceY() + this.targetY()) / 2.0; };
            }
            else {
                this.midpointX = function() { return -20.0; };
                this.midpointY = function() { return 0.0; };
            }
        };

        viewModelFunctions.ChartViewModel = function (chartDataModel) {
            this.data = chartDataModel;

            this.processes = createNodesViewModel(this.data.processes);

            this.connections = [];
            for (var i = 0; i < this.data.connections.length; ++i) {
                var source;
                if (!("data" in this.data.connections[i])) {
                    source = this.processes[this.data.connections[i].src.process].getOutport(this.data.connections[i].src.port);
                }
                var target = this.processes[this.data.connections[i].tgt.process].getInport(this.data.connections[i].tgt.port);
                this.connections.push(new viewModelFunctions.ConnectionViewModel(this.data.connections[i], source, target));
            }

            this.findConnectionsForProcess = function(process) {
                return this.connections.filter(function(connection) {
                    return connection.inport.parentNode === process || (connection.outport && connection.outport.parentNode === process);
                });
            };

            this.findConnectionsForConnector = function(connector) {
                return this.connections.filter(function(connection) {
                    return connection.inport === connector || connection.outport === connector;
                });
            };

            this.addDataConnection = function(data, inport) {
                // check there are no existing connections on this inport
                if (this.findConnectionsForConnector(inport).length > 0) {
                    return;
                }
                var dataModel = {
                    data: data,
                    tgt: {
                        process: inport.parentNode.id,
                        port: inport.data
                    }
                };
                var viewModel = new viewModelFunctions.ConnectionViewModel(dataModel, undefined, inport);
                this.data.connections.push(dataModel);
                this.connections.push(viewModel);
            };

            this.hasDataConnection = function(inport) {
                if (!inport.isInport()) { return; }
                var connections = this.findConnectionsForConnector(inport);
                var dataConnections = connections.filter(function(connection) {
                    return "data" in connection.data;
                });
                return dataConnections.length > 0;
            };

            this.addConnection = function(inport, outport) {
                // can only add a normal connection if there are no data connections on this inport
                if (this.hasDataConnection(inport)) { return; }
                var dataModel = {
                    src: {
                        process: outport.parentNode.id,
                        port: outport.data
                    },
                    tgt: {
                        process: inport.parentNode.id,
                        port: inport.data
                    }
                };
                var viewModel = new viewModelFunctions.ConnectionViewModel(dataModel, outport, inport);
                this.data.connections.push(dataModel);
                this.connections.push(viewModel);
            };

            this.deleteConnection = function(connection) {
                console.log(connection);
                console.log(connection.data);
                //this.data.connections.pop(connection.data);
                this.data.connections.splice(this.data.connections.indexOf(connection.data), 1);
                //this.connections.pop(connection);
                this.connections.splice(this.connections.indexOf(connection), 1);
            };

            this.canConnect = function(connector, otherConnector) {
                return connector && otherConnector && connector.parentNode !== otherConnector.parentNode && !this.hasDataConnection(connector) && !this.hasDataConnection(otherConnector) && connector.isInport() !== otherConnector.isInport();
            };

            this.addProcess = function(componentName, metadata) {
                var dataModel = {
                    component: componentName,
                    metadata: metadata
                };
                // get a unique id for the new process
                var i = 0;
                var id = componentName + i;
                while (id in this.processes) {
                    id = componentName + ++i;
                }
                var viewModel = new viewModelFunctions.NodeViewModel(id, dataModel);
                this.data.processes[id] = dataModel;
                this.processes[id] = viewModel;
            };

            this.deleteProcess = function(process) {
                // delete any connections to this process
                for (var connection in this.findConnectionsForProcess(process)) {
                    this.deleteConnection(connection);
                }
                delete this.data.processes[process.id];
                delete this.processes[process.id];
            };
        };

        return viewModelFunctions;
    }]);