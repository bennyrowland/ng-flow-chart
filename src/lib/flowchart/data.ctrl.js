/**
 * Created by ben on 02/02/16.
 */
angular.module('flowchart')
    .controller('dataCtrl', ['$uibModalInstance', '$scope', 'connection', function($uibModalInstance, $scope, connection) {
        $scope.connection = connection;
        $scope.data = connection.dataValue;

        $scope.submit = function() {
            console.log('closing modal instance');
            $uibModalInstance.close($scope.data);
        };
        $scope.cancel = function() {
            console.log('cancelled modal view');
            $uibModalInstance.dismiss();
        };
    }]);