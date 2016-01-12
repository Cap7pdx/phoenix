// DOMContentLoaded is fired once the document has been loaded and parsed,
// but without waiting for other external resources to load (css/images/etc)
// That makes the app more responsive and perceived as faster.
// https://developer.mozilla.org/Web/Reference/Events/DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {

  // We'll ask the browser to use strict code to help us catch errors earlier.
  // https://developer.mozilla.org/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode
  'use strict';

  var frameContainer = document.getElementById('frame-container');

  var gobackButton = document.getElementById('goback-button');
  var goforwardButton = document.getElementById('goforward-button');
  var urlInput = document.getElementById('url-input');
  var urlButton = document.getElementById('url-button');
  var domarray = [];
  var domint = 0;

  /**
   * The current displaying Tab
   */
  var currentTab;
  /**
   * The current url input cache
   */
  var currentUrlInput;
  /**
   * The default search engine URI
   *
   * @type {String}
   */
  var searchEngineUri = 'https://www.google.com/search?q={searchTerms}';

  /**
   * Using an input element to check the validity of the input URL. If the input
   * is not valid, returns a search URL.
   *
   * @param  {String} input           A plaintext URL or search terms
   * @param  {String} searchEngineUri The search engine to be used
   * @return {String}                 A valid URL
   */
  function getUrlFromInput(input, searchEngineUri) {
    var urlValidate = document.createElement('input');
    urlValidate.setAttribute('type', 'url');
    urlValidate.setAttribute('value', input);

    if (!urlValidate.validity.valid) {
      var uri = searchEngineUri.replace('{searchTerms}', input);
      return uri;
    }

    return input;
  }

  /**
   * When the URL input is focused, change the input text from the current
   * page title to the page URL for editing.
   */
  urlInput.addEventListener('focus', function () {
    if (currentTab && currentTab.url) {
      urlInput.value = currentTab.url;
      urlInput.setSelectionRange(0, urlInput.value.length);
    }
  });

  /**
   * When the URL input is out of focused, change the input text to the current
   * page title.
   */
  urlInput.addEventListener('blur', function () {
    currentUrlInput = urlInput.value;

    if (currentTab && currentTab.title) {
      urlInput.value = currentTab.title;
    }
  });

  /**
   * Check the input and browse the address with a Tab object on url submit.
   */
  window.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!currentUrlInput.trim()) {
      return;
    }

    if (frameContainer.classList.contains('empty')) {
      frameContainer.classList.remove('empty');
    }

    var url = getUrlFromInput(currentUrlInput.trim(), searchEngineUri);

    if (!currentTab) {
      currentTab = new Tab(url);
      frameContainer.appendChild(currentTab.iframe);
    } else if (currentUrlInput === currentTab.title) {
      currentTab.reload();
    } else {
      currentTab.goToUrl(url);
    }
  });

  /**
   * Handle goback and goforward button clicks.
   */
  window.addEventListener('click', function (e) {
    switch (e.target) {
      case gobackButton:
        if (currentTab) {
          currentTab.goBack();
        }
        break;
      case goforwardButton:
        if (currentTab) {
          currentTab.goForward();
        }
        break;
    }
  });

  /**
   * Save the url of the currentTab on locationchange event for display.
   */
  window.addEventListener('tab:locationchange', function (e) {
    if (currentTab === e.detail) {
      currentUrlInput = currentTab.url;
    }
  });

  /**
   * Display the title of the currentTab on titlechange event.
   */
  window.addEventListener('tab:titlechange', function (e) {
    if (currentTab === e.detail) {
      urlInput.value = currentTab.title;
    }
  });

  /**
   * Enable/disable goback and goforward buttons accordingly when the
   * currentTab is loaded.
   */
  window.addEventListener('tab:loadend', function (e) {
    if (currentTab === e.detail) {
      currentTab.getCanGoBack().then(function(canGoBack) {
        gobackButton.disabled = !canGoBack;
      });

      currentTab.getCanGoForward().then(function(canGoForward) {
        goforwardButton.disabled = !canGoForward;
      });
    }
  });

  /**
   * http://www.permadi.com/tutorial/domTree/ - Citation
   * @param targetDocument
   * @param currentElement
   * @param depth
   */
  function traverseDOMTree(targetDocument, currentElement, depth) {
    if (currentElement) {
      var j;
      var tagName = currentElement.tagName;
      // Prints the node tagName, such as <A>, <IMG>, etc
      // &lt < - &gt >
      if (tagName) {
        domarray[domint++] = "&lt;" + currentElement.tagName + "&gt;";
        if (currentElement.id) {
          targetDocument.writeln("Tag: " + "&lt;" + currentElement.tagName + "&gt;" + " Id: " + currentElement.id);
        } else {
          targetDocument.writeln("Tag: " + "&lt;" + currentElement.tagName + "&gt;" + " Id: " + "No Id");
        }
      } else {
        targetDocument.writeln(currentElement.nodeName);
      }

      // Traverse the tree
      var i = 0;
      var currentElementChild = currentElement.childNodes[i];
      while (currentElementChild) {
        // Formatting code (indent the tree so it looks nice on the screen)
        targetDocument.write("<BR>\n");
        for (j = 0; j < depth; j++) {
          // &#166 is just a vertical line
          // &nbsp - non-breaking space
          targetDocument.write("&nbsp;&nbsp;&#166");
        }
        targetDocument.writeln("<BR>");
        for (j = 0; j < depth; j++) {
          targetDocument.write("&nbsp;&nbsp;&#166");
        }
        if (tagName)
          targetDocument.write("--");

        // Recursively traverse the tree structure of the child node
        traverseDOMTree(targetDocument, currentElementChild, depth + 1);
        i++;
        currentElementChild = currentElement.childNodes[i];
      }
      // The remaining code is mostly for formatting the tree
      targetDocument.writeln("<BR>");
      for (j = 0; j < depth - 1; j++) {
        targetDocument.write("&nbsp;&nbsp;&#166");
      }
      targetDocument.writeln("&nbsp;&nbsp;");
    }
    if (tagName) {
      domarray[domint++] = "&lt;/" + currentElement.tagName + "&gt;";
      targetDocument.writeln("&lt;/" + tagName + "&gt;");
    }
  }

  /**
   * This function accepts a DOM element as parameter and prints
   * out the DOM tree structure of the element.
   * @param domElement DOM element that need to be pretty printed.
   * @param destinationWindow Where to print DOM Tree?
   */

  function printDOMTree(domElement, destinationWindow) {
    // Use destination window to print the tree.  If destinationWIndow is
    // not specified, create a new window and print the tree into that window
    var outputWindow = destinationWindow;
    if (!outputWindow)
      outputWindow = window.open();

    // Make a valid html page
    outputWindow.document.open("text/html", "replace");
    outputWindow.document.write("<HTML><HEAD><h1>DOM Tree</h1><TITLE>DOM Tree</TITLE></HEAD><BODY>\n");
    outputWindow.document.write("<CODE>\n");
    // Print the tree
    traverseDOMTree(outputWindow.document, domElement, 0);
    outputWindow.document.write("<BR><BR>");
    // Print the array
    outputWindow.document.write("Stored tags (in order): " + domarray.toString());
    outputWindow.document.write("<BR><BR>");
    outputWindow.document.write("</CODE>\n");
    outputWindow.document.write("</BODY></HTML>\n");

    // Here we must close the document object, otherwise Mozilla browsers
    // might keep showing "loading in progress" state.
    outputWindow.document.close();
  }

  printDOMTree(document);
});