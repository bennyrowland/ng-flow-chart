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
            },
            templateUrl: "library/library.template.html",
            replace: false
        };
    }]);