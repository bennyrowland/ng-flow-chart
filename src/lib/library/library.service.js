/**
 * Created by ben on 07/12/15.
 */

angular.module('flowchart')
    .factory('flowLibrary', function() {
        var libraryFunctions = {};

        var loadedLibraries = {};

        libraryFunctions.addLibrary = function(name, lib) {
            if (name in loadedLibraries) {
                console.log('Library load error: there is already a library ' + name + ' loaded.');
                return;
            }
            loadedLibraries[name] = lib;
        };

        libraryFunctions.getComponentSchema = function(name) {
            // split the name into the library and the process
            var i = name.indexOf('/');
            var libraryName = name.slice(0, i);
            var componentName = name.slice(i+1);
            if (libraryName in loadedLibraries) {
                var library = loadedLibraries[libraryName];
                if (componentName in library) {
                    return library[componentName];
                }
                else {
                    console.log('Library access error: library ' + libraryName + ' has no component ' + componentName);
                    return null;
                }
            }
            else {
                console.log('Library access error: no library ' + libraryName + ' loaded');
                return null;
            }
        };

        libraryFunctions.getAllLibraries = function() {
            return loadedLibraries;
        };

        return libraryFunctions;
    });