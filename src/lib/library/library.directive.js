/**
 * Created by ben on 11/12/15.
 */
angular.module('flowchart')
    .directive('ngFlowLibrary', ['flowLibrary', function(flowLibrary) {
        return {
            restrict: 'E',
            scope: {
                graphSpec: '='
            },
            link: function (scope, element, attrs) {
                scope.libraries = flowLibrary.getAllLibraries();

                scope.processId = function(lib, process) {
                    return lib + "/" + process;
                };
            },
            templateUrl: "library/library.template.html",
            replace: false
        };
    }]);