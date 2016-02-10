/**
 * Created by ben on 11/12/15.
 */
angular.module('flowchart')
    .directive('ngFlowLibrary', ['flowLibrary', function(flowLibrary) {
        return {
            restrict: 'E',
            /*scope: {
                currentGraph: '='
            },*/
            link: function (scope, element, attrs) {
                scope.library = flowLibrary.getAllLibraries();
                scope.graphLibrary = angular.copy(flowLibrary.graphLibrary());

                scope.processId = function(folder, process) {
                    return folder + "." + process;
                };

                scope.treeOptions = {
                    nodeChildren: "children",
                    dirSelectable: false,
                    injectClasses: {
                        ul: "a1",
                        li: "a2",
                        liSelected: "a7",
                        iExpanded: "a3",
                        iCollapsed: "a4",
                        iLeaf: "a5",
                        label: "a6",
                        labelSelected: "a8"
                    }
                };
                scope.dataForTheTree =
                    [
                        { "name" : "core", "children" : [
                            { "name" : "core.count", "age" : "42", "children" : [] },
                            { "name" : "load", "children" : [
                                { "name" : "Jenifer", "children" : [
                                    { "name" : "Dani", "age" : "32", "children" : [] },
                                    { "name" : "Max", "age" : "34", "children" : [] }
                                ]}
                            ]}
                        ]},
                        { "name" : "string.split", "age" : "33", "children" : [] },
                        { "name" : "Ron", "age" : "29", "children" : [] }
                    ];
            },
            templateUrl: "library/library.template.html",
            replace: false
        };
    }]);