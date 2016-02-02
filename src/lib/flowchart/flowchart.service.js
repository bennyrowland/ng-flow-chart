/**
 * Created by ben on 09/12/15.
 */

angular.module('flowchart')
    .factory('viewmodel', ['flowLibrary', function(flowLibrary) {
        var viewModelFunctions = {};

        viewModelFunctions.nodeTitleHeight = 40;
        viewModelFunctions.nodeConnectorHeight = 20;

        viewModelFunctions.computeConnectorY = function (connectorIndex) {
            return viewModelFunctions.nodeTitleHeight + (connectorIndex * viewModelFunctions.nodeConnectorHeight);
        };

        viewModelFunctions.OutportViewModel = function (connectorModel, parentNode) {
            var self = Object.create(this);

            self.data = connectorModel;
            self.process = parentNode;

            self.isInport = function () {
                return false;
            };

            self.model = function () {
                return this.data;
            };

            self.x = function () {
                return self.process.width();
            };

            self.y = function () {
                return viewModelFunctions.computeConnectorY(this.process.outports.indexOf(self));
            };

            return self;
        };

        viewModelFunctions.InportViewModel = function (connectorModel, parentNode) {
            var self = viewModelFunctions.OutportViewModel(connectorModel, parentNode);

            self.isInport = function () {
                return true;
            };

            self.x = function() {
                return 0;
            };

            self.y = function () {
                return viewModelFunctions.computeConnectorY(this.process.inports.indexOf(self));
            };

            return self;
        };

        viewModelFunctions.NodeViewModel = function (id, processModel, chart) {
            var self = Object.create(this);

            self.data = processModel;
            self.id = id;

            self.model = function () {
                return this.data;
            };

            self.getInport = function (inportName) {
                for (var i = 0; i < self.inports.length; ++i) {
                    if (self.inports[i].data.name === inportName) {
                        return this.inports[i];
                    }
                }
                return undefined;
            };

            self.getOutport = function (outportName) {
                for (var i = 0; i < self.outports.length; ++i) {
                    if (self.outports[i].data.name === outportName) {
                        return self.outports[i];
                    }
                }
                return undefined;
            };

            // create our inports and outports
            var template;
            if ('template' in processModel) {
                template = processModel.template;
            }
            else if (processModel.component === 'core.graph') {
                template = flowLibrary.getGraphSchema(processModel.metadata.graph);
            }
            else {
                template = flowLibrary.getComponentSchema(processModel.component);
            }

            // make sure that both inports and outports are in the template
            if (!template.hasOwnProperty('inports')) {
                template.inports = [];
            }
            if (!template.hasOwnProperty('outports')) {
                template.outports = [];
            }

            self.inports = template.inports.map(function (inportModel) {
                return viewModelFunctions.InportViewModel(inportModel, self);
            });
            self.outports = template.outports.map(function (outportModel) {
                return viewModelFunctions.OutportViewModel(outportModel, self);
            });

            self.width = function () {
                return 200;
            };

            self.height = function () {
                var numConnectorRows = Math.max(self.inports.length, self.outports.length);
                return viewModelFunctions.computeConnectorY(numConnectorRows);
            };

            return self;
        };

        viewModelFunctions.ConnectionViewModel = function (inport, outport) {
            var self = Object.create(this);

            self.inport = inport;
            self.targetX = function () { return self.inport.process.data.metadata.x + self.inport.x(); };
            self.targetY = function () { return self.inport.process.data.metadata.y + self.inport.y(); };

            if (typeof outport === 'string') {
                // this is a data connection
                self.isDataConnection = function () {
                    return true;
                };

                self.dataValue = outport;

                self.model = function () {
                    return {
                        data: self.dataValue,
                        tgt: {
                            process: self.inport.process.id,
                            port: self.inport.data.name
                        }
                    };
                };

                // "midpoint" for a data connection is where to show the delete button
                self.midpointX = function () { return -20.0; };
                self.midpointY = function () { return 0.0; };
            }
            else {
                // ordinary connection
                self.isDataConnection = function () {
                    return false;
                };

                self.outport = outport;
                self.sourceX = function () { return self.outport.process.data.metadata.x + self.outport.x(); };
                self.sourceY = function () { return self.outport.process.data.metadata.y + self.outport.y(); };
                self.midpointX = function () { return (self.sourceX() + self.targetX()) / 2.0; };
                self.midpointY = function () { return (self.sourceY() + self.targetY()) / 2.0; };

                self.model = function () {
                    return {
                        src: {
                            process: self.outport.process.id,
                            port: self.outport.data.name
                        },
                        tgt: {
                            process: self.inport.process.id,
                            port: self.inport.data.name
                        }
                    };
                };
            }

            return self;
        };

        viewModelFunctions.ChartViewModel = function (chartData) {
            var self = Object.create(this);
            if (typeof chartData === 'string') {
                chartData = JSON.parse(chartData);
            }

            // functions to introspect the chart
            self.canConnect = function (connector, otherConnector) {
                return connector && otherConnector && connector.process !== otherConnector.process && !self.hasDataConnection(connector) && !self.hasDataConnection(otherConnector) && connector.isInport() !== otherConnector.isInport();
            };

            self.connect = function (inport, outport) {
                if (self.canConnect(inport, outport)) {
                    self.connections.push(viewModelFunctions.ConnectionViewModel(inport, outport));
                }
            };

            self.deleteConnection = function (connection) {
                self.connections.splice(self.connections.indexOf(connection), 1);
            };

            self.getConnectionsForProcess = function (process) {
                return self.connections.filter(function (connection) {
                    return connection.inport.process === process || (!connection.isDataConnection() && connection.outport.process === process);
                });
            };

            self.getConnectionsForConnector = function (connector) {
                return self.connections.filter(function (connection) {
                    return connection.inport === connector || (!connection.isDataConnection() && connection.outport === connector);
                });
            };

            self.hasDataConnection = function (inport) {
                if (!inport.isInport()) {
                    return;
                }
                var connections = self.getConnectionsForConnector(inport);
                var dataConnections = connections.filter(function (connection) {
                    return connection.isDataConnection();
                });
                return dataConnections.length > 0;
            };

            self.addDataConnection = function (inport, data) {
                self.connections.push(viewModelFunctions.ConnectionViewModel(inport, data));
            };

            self.getProcess = function (processId) {
                if (processId == "inports") {
                    return inportsParent;
                }
                else if (processId == "outports") {
                    return outportsParent;
                }
                else {
                    return self.processes[processId];
                }
            };

            self.addProcess = function (componentName, metadata) {
                var model = {
                    component: componentName,
                    metadata: metadata
                };
                // get a unique id for the new process based on the component name
                var i = 0;
                do {
                    id = componentName + i++;
                } while (id in this.processes);
                self.processes[id] = viewModelFunctions.NodeViewModel(id, model, self);
            };

            self.deleteProcess = function (process) {
                // have to delete the connections attached to this process first
                var connectionsToDelete = self.getConnectionsForProcess(process);
                for (var i = 0; i < connectionsToDelete.length; i++) {
                    self.deleteConnection(connectionsToDelete[i]);
                }
                delete self.processes[process.id];
            };

            // just store the metadata of the chart
            self.properties = chartData.properties;

            // create all the processes
            self.processes = {};
            Object.keys(chartData.processes).forEach(function (processId) {
                self.processes[processId] = viewModelFunctions.NodeViewModel(processId, chartData.processes[processId], self);
            });

            // we need two dummy processes to act as parents for the inports and outports
            var inportsParent = {
                id: "inports",
                chart: self,
                data: {metadata: {x: 0, y: 0}},
                width: function () { return self.inports.width(); },
                getOutport: function (inportName) {
                    for (var i = 0; i < self.inports.length; ++i) {
                        if (self.inports[i].data.name === inportName) {
                            return self.inports[i];
                        }
                    }
                    return undefined;
                }
            };
            var outportsParent = {
                id: "outports",
                chart: self,
                data: {metadata: {x: 0, y: 0}},
                width: function () { return self.outports.width(); },
                getInport: function (outportName) {
                    for (var i = 0; i < self.outports.length; ++i) {
                        if (self.outports[i].data.name === outportName) {
                            return self.outports[i];
                        }
                    }
                    return undefined;
                }
            };

            // make sure that both inports and outports are in the template
            if (!chartData.hasOwnProperty('inports')) {
                chartData.inports = [];
            }
            if (!chartData.hasOwnProperty('outports')) {
                chartData.outports = [];
            }
            // now create the connectors for the inports and outports
            self.inports = chartData.inports.map(function (inportModel) {
                return viewModelFunctions.OutportViewModel(inportModel, inportsParent);
            });
            self.inports.height = function () {
                return viewModelFunctions.computeConnectorY(this.length);
            };
            self.inports.width = function () {
                return 100;
            };
            self.inports.move = function (oldIndex, newIndex) {
                if (oldIndex < newIndex) {
                    newIndex--;
                }
                this.splice(newIndex, 0, this.splice(oldIndex, 1)[0]);
            };
            self.inports.add = function () {
                var inport_name;
                var inport_index = 1;
                do {
                    inport_name = "new inport " + inport_index++;
                } while (false);
                var new_inport = viewModelFunctions.OutportViewModel({
                    name: inport_name
                }, inportsParent);
                this.push(new_inport);
            };
            inportsParent.outports = self.inports;

            self.outports = chartData.outports.map(function (outportModel) {
                return viewModelFunctions.InportViewModel(outportModel, outportsParent);
            });
            self.outports.height = function () {
                return viewModelFunctions.computeConnectorY(this.length);
            };
            self.outports.width = function () {
                return 100;
            };
            self.outports.move = function (oldIndex, newIndex) {
                if (oldIndex < newIndex) {
                    newIndex--;
                }
                this.splice(newIndex, 0, this.splice(oldIndex, 1)[0]);
            };
            self.outports.add = function () {
                var outport_name;
                var outport_index = 1;
                do {
                    outport_name = "new outport " + outport_index++;
                } while (false);
                var new_outport = viewModelFunctions.InportViewModel({
                    name: outport_name
                }, outportsParent);
                this.push(new_outport);
            };
            outportsParent.inports = self.outports;

            // finally we create the connections
            self.connections = chartData.connections.map(function (connectionModel) {
                var inport = self.getProcess(connectionModel.tgt.process).getInport(connectionModel.tgt.port);
                var outport;
                if ('data' in connectionModel) {
                    outport = connectionModel.data;
                }
                else {
                    outport = self.getProcess(connectionModel.src.process).getOutport(connectionModel.src.port);
                }
                return viewModelFunctions.ConnectionViewModel(inport, outport);
            });


            self.model = function () {

                var processDict = {};
                Object.keys(self.processes).forEach(function (processId) {
                    processDict[processId] = self.processes[processId].model();
                });

                return {
                    properties: self.properties,
                    processes: processDict,
                    connections: self.connections.map(function (connection) {
                        return connection.model();
                    }),
                    inports: self.inports.map(function (inport) {
                        return inport.model();
                    }),
                    outports: self.outports.map(function (outport) {
                        return outport.model();
                    })
                };
            };

            self.setViewSize = function (width, height) {
                inportsParent.data.metadata.y = (height - self.inports.height()) / 2.0;
                outportsParent.data.metadata.y = (height - self.outports.height()) / 2.0;
                outportsParent.data.metadata.x = width - self.outports.width();
            };

            return self;
        };

        return viewModelFunctions;
    }]);