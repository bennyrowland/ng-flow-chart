/**
 * Created by ben on 02/02/16.
 */
angular.module('flowchart')
    .controller('portsCtrl', ['$uibModalInstance', '$scope', function($uibModalInstance, $scope) {
        $scope.submit = function() {
            console.log('closing modal instance');
            $uibModalInstance.close();
        };
        $scope.cancel = function() {
            console.log('cancelled modal view');
            $uibModalInstance.dismiss();
        };
    }]);