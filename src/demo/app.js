/**
 * Created by ben on 04/12/15.
 */

angular.module('flowchartDemo', ['flowchart', 'monospaced.mousewheel'])
    .controller('MainCtrl', ['$scope', 'flowLibrary', function($scope, flowLibrary) {
        $scope.name = 'Alex';

        flowLibrary.addLibrary("core", {
            'ReadFile': {
                inports: ["source", "dummy"],
                outports: ["out"]
            },
            'SplitStr': {
                inports: ["in"],
                outports: ["out"]
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
                        "x": 10,
                        "y": 100
                    }
                },
                "Split by Lines": {
                    "component": "core/SplitStr",
                    "metadata": {
                        "x": 250,
                        "y": 10
                    }
                }
            },
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
                }
            ]
        };
    }]);