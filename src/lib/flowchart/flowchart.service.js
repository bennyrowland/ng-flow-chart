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
            viewModels.modelArray = connectorDataModels;

            if (connectorDataModels) {
                for (var i = 0; i < connectorDataModels.length; ++i) {
                    var connectorViewModel = new viewModelFunctions.ConnectorViewModel(connectorDataModels[i], x, viewModelFunctions.computeConnectorY(i), parentNode);
                    viewModels.push(connectorViewModel);
                }
            }
            viewModels.push = function() {
                Array.prototype.push.apply(this.modelArray, [arguments[0].data]);
                Array.prototype.push.apply(this, arguments);
            };
            viewModels.remove = function(index) {
                this.modelArray.splice(index, 1);
                this.splice(index, 1);
            };
            viewModels.move = function(oldIndex, newIndex) {
                if (oldIndex < newIndex) {
                    newIndex--;
                }
                this.modelArray.splice(newIndex, 0, this.modelArray.splice(oldIndex, 1)[0]);
                this.splice(newIndex, 0, this.splice(oldIndex, 1)[0]);
            };
            return viewModels;
        };

        /*viewModelFunctions.InportsViewModel = function(inportsDataModel) {
            this.inports = createConnectorsViewModel(inportsDataModel, 50, this);
        };*/

        viewModelFunctions.NodeViewModel = function (id, nodeDataModel) {
            this.id = id;
            this.data = nodeDataModel;
            if ('template' in nodeDataModel) {
                this.template = nodeDataModel.template;
            }
            else {
                this.template = flowLibrary.getComponentSchema(this.data.component);
            }

            if ('width' in nodeDataModel.metadata) {
                this.width = function() { return this.data.metadata.width; };
            }
            else {
                this.width = function () { return viewModelFunctions.defaultNodeWidth; };
            }

            this.inports = createConnectorsViewModel(this.template.inports, 0, this);
            this.outports = createConnectorsViewModel(this.template.outports, this.width(), this);

            this.height = function () {
                var numConnectorRows = Math.max(this.inports.length, this.outports.length);
                return viewModelFunctions.computeConnectorY(numConnectorRows);
            };

            this.getInport = function (name) {
                for (var i = 0; i < this.inports.length; ++i) {
                    if (this.inports[i].data.name === name) {
                        return this.inports[i];
                    }
                }
                return undefined;
            };

            this.getOutport = function (name) {
                for (var i = 0; i < this.outports.length; ++i) {
                    if (this.outports[i].data.name === name) {
                        return this.outports[i];
                    }
                }
                return undefined;
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

            // create array of processes
            this.processes = createNodesViewModel(this.data.processes);
            // we also need two helper processes for the inports and outports
            this.inports = new viewModelFunctions.NodeViewModel('inports', {
                metadata: {x: 0, y: 0, width: 50},
                template: {
                    outports: this.data.inports
                }
            });
            this.outports = new viewModelFunctions.NodeViewModel('outports', {
                metadata: {x: 0, y: 0, width: 50},
                template: {
                    inports: this.data.outports
                }
            });

            this.getProcess = function(processName) {
                if (processName == "inports") { return this.inports; }
                else if (processName == "outports") { return this.outports; }
                else { return this.processes[processName]; }
            };

            this.connections = [];
            for (var i = 0; i < this.data.connections.length; ++i) {
                var source;
                if (!("data" in this.data.connections[i])) {
                    source = this.getProcess(this.data.connections[i].src.process).getOutport(this.data.connections[i].src.port);
                }
                var target = this.getProcess(this.data.connections[i].tgt.process).getInport(this.data.connections[i].tgt.port);
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
                        port: inport.data.name
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
                        port: outport.data.name
                    },
                    tgt: {
                        process: inport.parentNode.id,
                        port: inport.data.name
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
                    ++i;
                    id = componentName + i;
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

            this.addInport = function (inport) {
                if (inport === undefined) {
                    var inport_name;
                    var inport_index = 1;
                    do {
                        inport_name = "new inport " + inport_index++;
                        console.log("checking inport name " + inport_name);
                    } while (this.inports.getOutport(inport_name) !== undefined);
                    inport = {
                        name: inport_name
                    };
                }
                console.log("adding inport ");
                console.log(inport);
                //this.data.inports.push(inport);
                var newConnector = new viewModelFunctions.ConnectorViewModel(inport, 0, viewModelFunctions.computeConnectorY(this.inports.outports.length), this.inports);
                this.inports.outports.push(newConnector);
            };

            this.addOutport = function(outport) {
                if (outport === undefined) {
                    var outport_name;
                    var outport_index = 1;
                    do {
                        outport_name = "new outport " + outport_index++;
                    } while (this.outports.getInport(outport_name) !== undefined);
                    outport = {
                        name: outport_name
                    };
                }
                var newConnector = new viewModelFunctions.ConnectionViewModel(outport, 0, viewModelFunctions.computeConnectorY(this.outports.inports.length), this.outports);
                this.outports.inports.push(newConnector);
            };
        };

        return viewModelFunctions;
    }]);