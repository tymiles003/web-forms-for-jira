; (function (angular, jiraConfig, document) {
  'use strict';
  
  angular.module('jiraCreate')
    .provider('JIRA', function () {
      var jira = {};
      this.$get = ['$http', '$filter', '$q', function ($http, $filter, $q) {
        jira.encloseInObject = function (field) {
          return { value: field };
        };
        
        jira.generateField = function (field, inquiry) {
          if (field.value) {
            return field.value;
          } else if (!inquiry[field.inquiryField]) {
            return;
          }
          var value = field.map ? field.map[inquiry[field.inquiryField]] : inquiry[field.inquiryField];
          value = field.filter ? field.filter(value) : value;
          return field.encloseInObject ? jira.encloseInObject(value) : value;
        };
        
        jira.createIssue = function (summary, issueType, project) {
          return  {
              fields: {
                summary: summary,
                issuetype: {
                  name: issueType
                },
                project:
                {
                  key: project
                }
              }
            };
        }
        
        jira.issuePath = jira.issuePath || '/rest/api/2/issue';
        jira.defaultProxy = jira.defaultProxy || '/jira-form-proxy.php?url=';
        jira.postItem = function (item, server, proxy) {
          return $http.post((proxy || jira.defaultProxy) + (server || jira.defaultServer) + jira.issuePath, item);
        }
        
        jira.submitRequest = function (inquiry, config) {
          if (config.onSubmit) {
            config.onSubmit();
          }
          var summary = angular.isString(config.summary) ? config.summary : config.summary(inquiry),
              issueType = angular.isString(config.issueType) ? config.issueType : config.issueType(inquiry),
              project = angular.isString(config.projectKey) ? config.projectKey : config.projectKey(inquiry),
              issue = jira.createIssue(summary, issueType, project);
  
          angular.forEach(config.commonFields, function (fieldMeta, fieldName) {
            issue.fields[fieldName] = jira.generateField(fieldMeta, inquiry);
          });
  
          if (angular.isDefined(config.issueTypes)) {
            angular.forEach(config.issueTypes[issue.fields.issuetype.name], function (fieldMeta, fieldName) {
              issue.fields[fieldName] = jira.generateField(fieldMeta, inquiry);
            });
          }
  
          issue.fields[config.inquiryDumpField] = $filter('json')(inquiry);
  
          return jira.postItem($filter('json')(issue), config.server, config.proxyUrl);
        };
        
        return jira;
      }];
      
      this.setJIRAIssueCreationPath = function (path) {
        jira.issuePath = path;
      }
      this.setServer = function (server) {
        jira.defaultServer = server;
      }
      this.setProxy = function (proxy) {
        jira.defaultProxy = proxy;
      }
    });

  angular.module('jiraForm', ['ngMessages', 'templates', 'jiraCreate'])
    .controller('InquiryController', function (JIRA, $scope, validateConfig) {
      var that = this;
      that.config = angular.isString($scope.config) ? window[$scope.config] : $scope.config;
      var defaultInquiry = {};
      that.inquiry = angular.copy(defaultInquiry);
      angular.forEach(that.config.formFields, function (field) {
        that.inquiry[field.inquiryField] = field.default;
      });
      that.message = {};
      that.failureContact = that.config.errorContact
      if (!validateConfig(that.config)) {
        that.showFailureMessage = true;
        return;
      }
      angular.forEach(that.config.formFields, function (f) {
        if (f.default) {
          that.inquiry[f.inquiryField] = f.default;
        }
      });

      function handleError(error) {
        if (error.status != undefined) {
          that.message.error = error.status == 0 ? "The server couldn't be reached" : 'Failed to access server with return status: ' + error.statusText;
        } else {
          that.message.error = error;
        }
      }

      that.submit = function () {
        that.message.success = undefined;
        that.message.error = undefined;
        that.submitting = true;

        JIRA.submitRequest(that.inquiry, that.config)
          .then(function (response){
            var data = response.data;
            if (!(angular.isObject(data) && angular.isString(data.self) && angular.isString(data.key)&& angular.isString(data.id))) {
              throw 'Got success, but response does not match expectation.';
            }
          })
          .then(function () {
            that.message.success = 'Request has been submitted successfully';
            that.inquiry = angular.copy(defaultInquiry);
            $scope.ssForm.$setPristine();
            $scope.ssForm.$setUntouched();
          })
          .catch(handleError)
          .finally(function () {
            that.submitting = false;
          });
      };
    })
    .directive('inquiryForm', function () {
      return {
        restrict: 'E',
        templateUrl: 'form.html',
        controller: 'InquiryController as inquiryController',
        scope: {
          config: "="
        }
      };
    })
    .factory('validateConfig', function () {
      function warn(err) {
        console.warn(err);
      }
      
      return function validateConfig(config) {
        if (!angular.isDefined(config)) {
          warn('configuration is undefined');
          return false;
        }
        if (!angular.isString(config.proxyUrl)) {
          warn('proxyUrl is undefined')
          return false;
        }
        if (!angular.isString(config.server)) {
          warn('No server provided');
          return false;
        }
        if (!angular.isString(config.inquiryDumpField)) {
          warn('No field provided to dump input to');
          return false;
        }
        if (!angular.isArray(config.formFields) || config.formFields.length == 0) {
          warn('No form fields provided')
          return false;
        }
        var ok = true;
        angular.forEach(config.formFields, function (field, i) {
          if (!field.name || !field.type || (field.type == "select" && !angular.isArray(field.options))) {
            warn('Invalid field ' + i)
            ok = false;
          }
        });
        if (!ok) {
          return false;
        }
        if (!config.issueTypes && !angular.isString(config.issueType)) {
          warn('No issue types defined');
          return false;
        }
        if (!angular.isString(config.issueType) && !angular.isFunction(config.issueType)) {
          warn('No issue type function or string defined');
          return false;
        }
        if (!angular.isString(config.projectKey)) {
          warn('No project key defined');
          return false;
        }
        
        if (!angular.isString(config.summary) && !angular.isFunction(config.summary)) {
          warn('No summary field string or function defined');
          return false;
        }
        return true;
      }
    });

  var appElems = document.querySelectorAll('[ng-app]');

  if (appElems.length == 0) {
    // Manually bootstrap onto element since there are no auto bootstrapped apps to do it for us
    angular.element(document).ready(function () {
      angular.forEach(document.getElementsByTagName('inquiry-form'), function (el) {
        angular.bootstrap(el, ['jiraForm']);
      });
    });
  }
})(window.angular, window.jiraConfig, window.document);