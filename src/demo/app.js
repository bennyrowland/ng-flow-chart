/**
 * Created by ben on 04/12/15.
 */

angular.module('flowchartDemo', ['flowchart', 'monospaced.mousewheel'])
    .controller('MainCtrl', ['$scope', 'flowLibrary', 'viewmodel', function($scope, flowLibrary, viewmodel) {
        $scope.name = 'Alex';

        flowLibrary.addLibrary("core", {
            'ReadFile': {
                inports: [{"name": "source"}, {"name": "dummy"}],
                outports: [{"name": "out"}]
            },
            'SplitStr': {
                inports: [{"name": "in"}],
                outports: [{"name": "out"}]
            }
        });

        flowLibrary.setComponentLibrary({
            folders: {
                core: {
                    folders: {},
                    components: {
                        count: {
                            outports: [
                                {
                                    name: 'sum'
                                }
                            ],
                            inports: [
                                {
                                    name: 'in'
                                }
                            ]
                        },
                        log: {
                            'outports': [],
                            'inports': [
                                {
                                    'name': 'in'
                                }
                            ]
                        },
                        readfile: {
                            'outports': [
                                {
                                    'name': 'out'
                                }
                            ],
                            'inports': [
                                {
                                    'name': 'source'
                                }
                            ]
                        }
                    }
                },
                'string': {
                    'folders': {},
                    'components': {
                        'split': {
                            'outports': [
                                {
                                    'name': 'out'
                                }
                            ],
                            'inports': [
                                {
                                    'name': 'separator'
                                },
                                {
                                    'name': 'in'
                                }
                            ]
                        }
                    }
                }
            }
        });

        flowLibrary.setGraphLibrary([
            {"id": "first_graph", "name": "My First Graph", "config": {"inports": [{"name": "separator"}, {"name": "source"}]}},
            {"id": "split_count", "name": "Split & Count", "config": {"inports": [{"name": "in"}, {"name": "separator"}], "outports": [{"name": "out"}]}}
        ]);

        $scope.graph = {
            "properties": {
                "name": "Split input and count"
            },
            "processes": {
                "Split": {
                    "component": "string.split",
                    "metadata": {
                        "x": 250,
                        "y": 10
                    }
                },
                "Count": {
                    "component": "core.count",
                    "metadata": {
                        "x": 250,
                        "y": 120
                    }
                }
            },
            "inports": [
                {
                    "name": "in"
                },
                {
                    "name": "separator"
                }
            ],
            "outports": [
                {
                    "name": "out"
                }
            ],
            "connections": [
                {
                    "src": {
                        "process": "Split",
                        "port": "out"
                    },
                    "tgt": {
                        "process": "Count",
                        "port": "in"
                    }
                },
                {
                    "src": {
                        "process": "inports",
                        "port": "in"
                    },
                    "tgt": {
                        "process": "Split",
                        "port": "in"
                    }
                },
                {
                    "src": {
                        "process": "inports",
                        "port": "separator"
                    },
                    "tgt": {
                        "process": "Split",
                        "port": "separator"
                    }
                },
                {
                    "src": {
                        "process": "Count",
                        "port": "sum"
                    },
                    "tgt": {
                        "process": "outports",
                        "port": "out"
                    }
                }
            ]
        };

        //$scope.chart = viewmodel.ChartViewModel($scope.graph);
        //console.log($scope.chart);
        //console.log(JSON.stringify($scope.chart.model()));
        //$scope.chart.processes["Read File"].inports[0].data.name = "Fish";
        //$scope.chart.addProcess("core/ReadFile", {});
        //$scope.chart.deleteConnection($scope.chart.connections[0]);

    }]);