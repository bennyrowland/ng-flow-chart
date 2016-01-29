/**
 * Created by ben on 04/12/15.
 */

angular.module('flowchartDemo', ['flowchart', 'monospaced.mousewheel'])
    .controller('MainCtrl', ['$scope', 'flowLibrary', function($scope, flowLibrary) {
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

        $scope.graph = {
            "properties": {
                "name": "Count lines in a file"
            },
            "processes": {
                "Read File": {
                    "component": "core/ReadFile",
                    "metadata": {
                        "x": 100,
                        "y": 100
                    }
                },
                "Split by Lines": {
                    "component": "core/SplitStr",
                    "metadata": {
                        "x": 350,
                        "y": 10
                    }
                }
            },
            "inports": [
                {
                    "name": "in 1"
                },
                {
                    "name": "in 2"
                }
            ],
            "outports": [
                {
                    "name": "out 1"
                }
            ],
            "connections": [
                {
                    "data": "package.json",
                    "tgt": {
                        "process": "Read File",
                        "port": "source"
                    }
                },
                {
                    "src": {
                        "process": "Read File",
                        "port": "out"
                    },
                    "tgt": {
                        "process": "Split by Lines",
                        "port": "in"
                    }
                },
                {
                    "src": {
                        "process":"inports",
                        "port":"in 2"
                    },
                    "tgt":
                    {
                        "process":"Read File",
                        "port":"dummy"
                    }
                }
            ]
        };
    }]);