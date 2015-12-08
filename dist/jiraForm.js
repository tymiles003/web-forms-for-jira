angular.module('templates',[]).run(['$templateCache', function($templateCache) {
    $templateCache.put('form.html',
        "<span ng-show=\"inquiryController.showFailureMessage\">\n  <h2>Something went wrong. If you continue to see this message, please contact us at {{inquiryController.failureContact}}</h2></span>\n<div ng-show=\"!inquiryController.showFailureMessage\" class=\"well bs-component\">\n  <form id=\"ss-form\" name=\"ssForm\" ng-submit=\"inquiryController.submit()\" novalidate=\"novalidate\" class=\"form-horizontal\">\n    <fieldset>\n      <legend>{{inquiryController.config.title}}</legend>\n      <div ng-repeat=\"input in inquiryController.config.formFields\" ng-switch=\"input.type\" class=\"form-group\"><span ng-switch-when=\"checkbox\"><span class=\"col-sm-4 left-checkbox\">\n            <input type=\"checkbox\" ng-true-value=\"'Yes'\" ng-false-value=\"'No'\" name=\"{{input.inquiryField}}\" ng-model=\"inquiryController.inquiry[input.inquiryField]\" ng-required=\"input.required\"/></span>\n          <label for=\"{{input.inquiryField}}\" class=\"col-sm-8\"></label>{{input.name}}</span><span ng-switch-when=\"prelabel\">\n          <div class=\"col-sm-4\"></div>\n          <div class=\"col-sm-8\">{{input.name}}</div></span><span ng-switch-when=\"freeformText\">\n          <label class=\"col-sm-4 control-label\">{{input.name}}<span ng-if=\"input.required\" class=\"required\">*</span><span ng-if=\"::!input.hideColon\">:</span></label>\n          <div class=\"col-sm-8\">\n            <textarea name=\"{{input.inquiryField}}\" ng-model=\"inquiryController.inquiry[input.inquiryField]\" ng-required=\"input.required\" class=\"form-control big-text-box\"></textarea>\n          </div></span><span ng-switch-default=\"ng-switch-default\">\n          <label for=\"{{input.inquiryField}}\" class=\"col-sm-4 control-label\">{{input.name}}<span ng-if=\"input.required\" class=\"required\">*</span><span ng-if=\"::!input.hideColon\">:</span></label>\n          <div class=\"col-sm-8\"><span ng-switch=\"input.type\"><span ng-switch-when=\"label\"></span><span ng-switch-when=\"select\">\n                <select name=\"{{input.inquiryField}}\" ng-model=\"inquiryController.inquiry[input.inquiryField]\" class=\"form-control\">\n                  <option ng-repeat=\"value in input.options\" value=\"{{value}}\" ng-bind=\"value\"></option>\n                </select></span><span ng-switch-when=\"text\">\n                <input type=\"{{input.type}}\" placeholder=\"{{input.placeholder}}\" name=\"{{input.inquiryField}}\" ng-model=\"inquiryController.inquiry[input.inquiryField]\" ng-required=\"input.required\" maxlength=\"{{input.maxlength}}\" class=\"form-control\"/>\n                <div ng-messages=\"ssForm[input.inquiryField].$error\" role=\"alert\" class=\"text-warning\">\n                  <div ng-message=\"required\" ng-if=\"ssForm[input.inquiryField].$touched\">{{input.name}} is required</div>\n                  <div ng-message=\"minlength\">Email format appears incorrect, please check</div>\n                </div></span><span ng-switch-when=\"email\">\n                <input type=\"email\" name=\"{{input.inquiryField}}\" ng-model=\"inquiryController.inquiry[input.inquiryField]\" ng-required=\"input.required\" maxlength=\"{{input.maxlength}}\" class=\"form-control\"/>\n                <div ng-messages=\"ssForm[input.inquiryField].$error\" role=\"alert\" class=\"text-warning\">\n                  <div ng-message=\"required\" ng-if=\"ssForm[input.inquiryField].$touched\">{{input.name}} is required</div>\n                  <div ng-message=\"minlength\">{{input.name}} is too short</div>\n                  <div ng-message=\"email\">Email format appears incorrect, please check</div>\n                </div></span><span ng-switch-when=\"number\">\n                <input type=\"number\" name=\"{{input.inquiryField}}\" ng-model=\"inquiryController.inquiry[input.inquiryField]\" ng-required=\"input.required\" maxlength=\"{{input.maxlength}}\" class=\"form-control\"/>\n                <div ng-messages=\"ssForm[input.inquiryField].$error\" role=\"alert\" class=\"text-warning\">\n                  <div ng-message=\"required\" ng-if=\"ssForm[input.inquiryField].$touched\">{{input.name}} is required</div>\n                </div></span><span ng-switch-when=\"tel\">\n                <input type=\"tel\" name=\"{{input.inquiryField}}\" ng-model=\"inquiryController.inquiry[input.inquiryField]\" ng-required=\"input.required\" class=\"form-control\"/>\n                <div ng-messages=\"ssForm[input.inquiryField].$error\" role=\"alert\" class=\"text-warning\">\n                  <div ng-message=\"required\" ng-if=\"ssForm[input.inquiryField].$touched\">{{input.name}} is required</div>\n                </div></span><span ng-switch-default=\"ng-switch-default\"><span>{{input.name}} {{input.type}}</span></span></span></div></span></div><span ng-bind=\"inquiryController.message.success\" class=\"text-success\"></span><span ng-show=\"inquiryController.message.error\" ng-bind=\"inquiryController.message.error + &quot; If you continue to see this error, contact us at &quot; + inquiryController.failureContact\" role=\"alert\" class=\"text-danger\"></span>\n      <div class=\"form-group\">\n        <div class=\"col-sm-8 col-sm-push-4\">\n          <input type=\"hidden\" name=\"draftResponse\" value=\"[]                    \"/>\n          <input type=\"hidden\" name=\"pageHistory\" value=\"0\"/><br/>\n          <input id=\"ss-submit\" type=\"submit\" name=\"submit\" value=\"{{inquiryController.submitting ? &quot;Submitting&quot; : &quot;Submit&quot;}}\" ng-disabled=\"ssForm.$invalid || inquiryController.submitting\" class=\"btn btn-primary\"/>\n        </div>\n      </div><span class=\"col-sm-8 col-sm-offset-4\"><span class=\"required\">*</span>Indicates a required field</span>\n    </fieldset>\n  </form>\n</div>");
}]);
; (function (angular, jiraConfig, document) {
  'use strict';

  angular.module('jiraForm', ['ngMessages', 'templates', 'jiraCreate'])
    .controller('InquiryController', ["JIRA", "$scope", "validateConfig", function (JIRA, $scope, validateConfig) {
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
    }])
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