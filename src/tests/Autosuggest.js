'use strict';

jest.dontMock('../Autosuggest.js');

import React from 'react/addons';
import Autosuggest from '../Autosuggest.js';

let TestUtils = React.addons.TestUtils;
let Simulate = TestUtils.Simulate;
let SimulateNative = TestUtils.SimulateNative;
let suburbs = ['Cheltenham', 'Mill Park', 'Mordialloc', 'Nunawading'];
let reactAttributesRegex = / data-react[-\w]+="[^"]+"/g;
let autosuggest, input, suggestions;

function getSuburbs(input, callback) {
  let regex = new RegExp('^' + input, 'i');

  callback(null, suburbs.filter(function(suburb) {
    return regex.test(suburb);
  }));
}

function getIllegalSuburbs(input, callback) {
  callback(null, [
    { suburb: 'Mill Park', postcode: '3083' },
    { suburb: 'Nunawading', postcode: '3131' }
  ]);
}

function getMultipleSectionsSuburbs(input, callback) {
  callback(null, [{
    suggestions: ['Forest Hill', 'Flinders Street']
  }, {
    sectionName: 'Second section',
    suggestions: ['Hobart', 'Adelaide']
  }, {
    sectionName: 'Third section',
    suggestions: ['Dandenong']
  }]);
}

function renderLocation(suggestion, input) {
  return (
    <span><strong>{suggestion.slice(0, input.length)}</strong>{suggestion.slice(input.length)}</span>
  );
}

// See: http://stackoverflow.com/q/28979533/247243
function stripReactAttributes(html) {
  return html.replace(reactAttributesRegex, '');
}

function setInputValue(value) {
  Simulate.change(input, { target: { value: value } });
}

function mouseDownSuggestion(suggestionIndex) {
  suggestions = TestUtils.scryRenderedDOMComponentsWithClass(autosuggest, 'react-autosuggest__suggestion');
  Simulate.mouseDown(React.findDOMNode(suggestions[suggestionIndex]));
}

// See: https://github.com/facebook/react/issues/1297
function mouseOver(from, to) {
  SimulateNative.mouseOut(from, { relatedTarget: to });
  SimulateNative.mouseOver(to, { relatedTarget: from });
}

function mouseOverFromInputToSuggestion(suggestionIndex) {
  suggestions = TestUtils.scryRenderedDOMComponentsWithClass(autosuggest, 'react-autosuggest__suggestion');
  mouseOver(input, React.findDOMNode(suggestions[suggestionIndex]));
}

function mouseOverFromSuggestionToInput(suggestionIndex) {
  suggestions = TestUtils.scryRenderedDOMComponentsWithClass(autosuggest, 'react-autosuggest__suggestion');
  mouseOver(React.findDOMNode(suggestions[suggestionIndex]), input);
}

function clickEscape() {
  Simulate.keyDown(input, { keyCode: 27 });
}

function clickDown() {
  Simulate.keyDown(input, { keyCode: 40 });
}

function clickUp() {
  Simulate.keyDown(input, { keyCode: 38 });
}

function expectInputValue(expectedValue) {
  expect(input.value).toBe(expectedValue);
}

function expectSuggestions(expectedSuggestions) {
  suggestions = TestUtils.scryRenderedDOMComponentsWithClass(autosuggest, 'react-autosuggest__suggestion');
  expect(suggestions.length).toBe(expectedSuggestions.length);

  for (let i = 0; i < expectedSuggestions.length; i++) {
    expect(React.findDOMNode(suggestions[i]).textContent === expectedSuggestions[i]);
  }
}

function expectFocusedSuggestion(suggestion) {
  let focusedSuggestions = TestUtils.scryRenderedDOMComponentsWithClass(autosuggest, 'react-autosuggest__suggestion--focused');

  if (suggestion === null) {
    expect(focusedSuggestions.length).toBe(0);
  } else {
    expect(focusedSuggestions.length).toBe(1);
    expect(React.findDOMNode(focusedSuggestions[0]).textContent).toBe(suggestion);
  }
}

function expectSections(expectedSections) {
  let sections = TestUtils.scryRenderedDOMComponentsWithClass(autosuggest, 'react-autosuggest__suggestions-section');
  
  expect(sections.length).toBe(expectedSections.length);

  for (let i = 0; i < sections.length; i++) {
    let sectionName = TestUtils.scryRenderedDOMComponentsWithClass(sections[i], 'react-autosuggest__suggestions-section-name');

    if (expectedSections[i] === null) {
      expect(sectionName.length).toBe(0);
    } else {
      expect(sectionName.length).toBe(1);
      expect(React.findDOMNode(sectionName[0]).textContent).toBe(expectedSections[i]);
    }
  }
}

function createAutosuggest(Autosuggest) {
  autosuggest = TestUtils.renderIntoDocument(Autosuggest);
}

function findInput() {
  input = React.findDOMNode(TestUtils.findRenderedDOMComponentWithTag(autosuggest, 'input'));
}

describe('Autosuggest', function() {
  describe('isMultipleSections()', function() {
    beforeEach(function() {
      createAutosuggest(<Autosuggest suggestions={getSuburbs} />);
    });

    it('should be multiple sections', function() {
      expect(autosuggest.isMultipleSections([ { suggestions: [] }])).toBe(true);
      expect(autosuggest.isMultipleSections([ { suggestions: ['a', 'b'] }])).toBe(true);
      expect(autosuggest.isMultipleSections([ { sectionName: 'First', suggestions: ['a', 'b'] }])).toBe(true);
    });

    it('should not be multiple sections', function() {
      expect(autosuggest.isMultipleSections(null)).toBe(false);
      expect(autosuggest.isMultipleSections([])).toBe(false);
      expect(autosuggest.isMultipleSections(['a', 'b'])).toBe(false);
      expect(autosuggest.isMultipleSections([ { sectionName: 'First' }])).toBe(false);
      expect(autosuggest.isMultipleSections([ { suburb: 'Mentone', postcode: 3192 }])).toBe(false);
    });
  });

  describe('suggestionsExist()', function() {
    beforeEach(function() {
      createAutosuggest(<Autosuggest suggestions={getSuburbs} />);
    });

    it('should have suggestions', function() {
      expect(autosuggest.suggestionsExist([ { suggestions: ['a'] }])).toBe(true);
      expect(autosuggest.suggestionsExist([ { suburb: 'Mentone', postcode: 3192 }])).toBe(true);
      expect(autosuggest.suggestionsExist([ { sectionName: 'First', suggestions: ['a', 'b'] }])).toBe(true);
      expect(autosuggest.suggestionsExist([ { sectionName: 'First', suggestions: [] }, { sectionName: 'Second', suggestions: ['a'] }])).toBe(true);
    });

    it('should not have suggestions', function() {
      expect(autosuggest.suggestionsExist(null)).toBe(false);
      expect(autosuggest.suggestionsExist([])).toBe(false);
      expect(autosuggest.suggestionsExist([ { suggestions: [] }])).toBe(false);
      expect(autosuggest.suggestionsExist([ { sectionName: 'First', suggestions: [] }, { sectionName: 'Second', suggestions: [] }])).toBe(false);
    });
  });

  describe('Illegal params', function() {
    it('should throw an error when "suggestions" are objects but "suggestionRenderer()" isn\'t provided', function() {
      createAutosuggest(<Autosuggest suggestions={getIllegalSuburbs} />);
      findInput();
      expect(setInputValue.bind(null, 'a')).toThrow('When <suggestion> is an object, you must implement the suggestionRenderer() function to specify how to render it.');
    });
  });

  describe('Basics', function() {
    beforeEach(function() {
      createAutosuggest(
        <Autosuggest inputAttributes={{ id: 'my-autosuggest',
                                        name: 'my-autosuggest-name',
                                        placeholder: 'Enter location...',
                                        className: 'my-sweet-autosuggest',
                                        value: 'my value' }}
                     suggestions={getSuburbs} />
      );
      findInput();
    });

    it('should set input attributes', function() {
      expect(input.id).toBe('my-autosuggest');
      expect(input.name).toBe('my-autosuggest-name');
      expect(input.getAttribute('placeholder')).toBe('Enter location...');
      expect(input.className).toBe('my-sweet-autosuggest');
    });

    it('should set initial value', function() {
      expectInputValue('my value');
    });

    it('should not show suggestions by default', function() {
      expectSuggestions([]);
    });

    it('should show suggestions when matches exist', function() {
      setInputValue('m');
      expectSuggestions(['Mill Park', 'Mordialloc']);
    });

    it('should not focus on suggestion when suggestions are shown', function() {
      setInputValue('m');
      expectFocusedSuggestion(null);
    });

    it('should show suggestions when case insensitive matches exist', function() {
      setInputValue('NUNA');
      expectSuggestions(['Nunawading']);
    });

    it('should show not suggestions when no matches exist', function() {
      setInputValue('a');
      expectSuggestions([]);
    });

    it('should hide suggestions when ESC is clicked and suggestions are shown', function() {
      setInputValue('m');
      clickEscape();
      expectSuggestions([]);
    });

    it('should clear the input when ESC is clicked and suggestions are not shown', function() {
      setInputValue('m');
      clickEscape();
      clickEscape();
      expectInputValue('');
    });
  });

  describe('Suggestion renderer', function() {
    beforeEach(function() {
      createAutosuggest(
        <Autosuggest inputAttributes={{ id: 'my-autosuggest', value: 'my value' }}
                     suggestions={getSuburbs}
                     suggestionRenderer={renderLocation} />
      );
      findInput();
      setInputValue('m');
    });

    it('should use the specified suggestionRenderer function', function() {
      suggestions = TestUtils.scryRenderedDOMComponentsWithClass(autosuggest, 'react-autosuggest__suggestion');
      expect(stripReactAttributes(React.findDOMNode(suggestions[0]).innerHTML)).toBe('<span><strong>M</strong><span>ill Park</span></span>');
    });
  });

  describe('Keyboard interactions', function() {
    beforeEach(function() {
      createAutosuggest(
        <Autosuggest inputAttributes={{ id: 'my-autosuggest', value: 'my-value' }}
                     suggestions={getSuburbs} />
      );
      findInput();
      setInputValue('m');
    });

    it('should focus on first suggestion and change input value when Down is clicked', function() {
      clickDown();
      expectFocusedSuggestion('Mill Park');
      expectInputValue('Mill Park');
    });

    it('should focus on next suggestion and change input value when Down is clicked again', function() {
      clickDown();
      clickDown();
      expectFocusedSuggestion('Mordialloc');
      expectInputValue('Mordialloc');
    });

    it('should remove focus from suggestions when last suggestion is focused and Down is clicked', function() {
      clickDown();
      clickDown();
      clickDown();
      expectFocusedSuggestion(null);
      expectInputValue('m');
    });

    it('should hide suggestions and revert back input\'s value when ESC is clicked after Down', function() {
      clickDown();
      clickEscape();
      expectSuggestions([]);
      expectInputValue('m');
    });

    it('should focus on last suggestion and change input value when Up is clicked', function() {
      clickUp();
      expectFocusedSuggestion('Mordialloc');
      expectInputValue('Mordialloc');
    });

    it('should focus on previous suggestion and change input value when Up is clicked again', function() {
      clickUp();
      clickUp();
      expectFocusedSuggestion('Mill Park');
      expectInputValue('Mill Park');
    });

    it('should remove focus from suggestions when first suggestion is focused and Up is clicked', function() {
      clickUp();
      clickUp();
      clickUp();
      expectFocusedSuggestion(null);
      expectInputValue('m');
    });
  });

  describe('Revealing the suggestions using keyboard', function() {
    beforeEach(function() {
      createAutosuggest(
        <Autosuggest inputAttributes={{ id: 'my-autosuggest', value: 'my value' }}
                     suggestions={getSuburbs} />
      );
      findInput();
      setInputValue('m');
      clickEscape();
    });

    it('should show suggestions when Down is clicked', function() {
      clickDown();
      expectSuggestions(['Mill Park', 'Mordialloc']);
      expectFocusedSuggestion(null);
    });

    it('should show suggestions when Up is clicked', function() {
      clickUp();
      expectSuggestions(['Mill Park', 'Mordialloc']);
      expectFocusedSuggestion(null);
    });
  });

  describe('Mouse interactions', function() {
    beforeEach(function() {
      createAutosuggest(
        <Autosuggest inputAttributes={{ id: 'my-autosuggest', value: 'my value' }}
                     suggestions={getSuburbs} />
      );
      findInput();
      setInputValue('m');
    });

    it('should set input field value when suggestion is clicked', function() {
      mouseDownSuggestion(1);
      expectInputValue('Mordialloc');
    });

    it('should focus on suggestion but not change input\'s value when mouse enters the suggestion', function() {
      mouseOverFromInputToSuggestion(0);
      expectFocusedSuggestion('Mill Park');
      expectInputValue('m');
    });

    it('should not have focused suggestions when mouse leaves the suggestion', function() {
      mouseOverFromInputToSuggestion(0);
      mouseOverFromSuggestionToInput(0);
      expectFocusedSuggestion(null);
    });

    it('should remember focused suggestion when mouse enters suggestion', function() {
      mouseOverFromInputToSuggestion(0);
      clickDown();
      expectFocusedSuggestion('Mordialloc');
      expectInputValue('Mordialloc');
    });
  });

  describe('Accessibility attributes', function() {
    beforeEach(function() {
      createAutosuggest(<Autosuggest suggestions={getSuburbs} />);
      findInput();
    });

    describe('when Autosuggest is rendered', function() {
      it('input\'s role should be combobox', function() {
        expect(input.getAttribute('role')).toBe('combobox');
      });

      it('input\'s aria-autocomplete should be list', function() {
        expect(input.getAttribute('aria-autocomplete')).toBe('list');
      });

      it('input\'s aria-expanded should be false', function() {
        expect(input.getAttribute('aria-expanded')).toBe('false');
      });

      it('input\'s aria-activedescendant should not present', function() {
        expect(input.getAttribute('aria-activedescendant')).toBeNull();
      });
    });

    describe('when suggestions appear', function() {
      beforeEach(function() {
        setInputValue('m');
      });

      it('input\'s aria-expanded should be true', function() {
        expect(input.getAttribute('aria-expanded')).toBe('true');
      });

      it('input\'s aria-expanded should become false when input is cleared', function() {
        setInputValue('');
        expect(input.getAttribute('aria-expanded')).toBe('false');
      });

      it('input\'s aria-activedescendant should be the id of the focused suggestion when using keyboard', function() {
        clickDown();
        suggestions = TestUtils.scryRenderedDOMComponentsWithClass(autosuggest, 'react-autosuggest__suggestion');
        expect(input.getAttribute('aria-activedescendant')).toBe(React.findDOMNode(suggestions[0]).id);
      });

      it('input\'s aria-activedescendant should be the id of the focused suggestion when using mouse', function() {
        mouseOverFromInputToSuggestion(0);
        suggestions = TestUtils.scryRenderedDOMComponentsWithClass(autosuggest, 'react-autosuggest__suggestion');
        expect(input.getAttribute('aria-activedescendant')).toBe(React.findDOMNode(suggestions[0]).id);
      });

      it('suggestion\'s role should be option', function() {
        clickDown();
        suggestions = TestUtils.scryRenderedDOMComponentsWithClass(autosuggest, 'react-autosuggest__suggestion');
        expect(React.findDOMNode(suggestions[0]).getAttribute('role')).toBe('option');
      });

      it('input\'s aria-owns should be equal to suggestions list\'s id', function() {
        suggestionsList = TestUtils.findRenderedDOMComponentWithClass(autosuggest, 'react-autosuggest__suggestions');
        expect(input.getAttribute('aria-owns')).toBe(React.findDOMNode(suggestionsList).id);
      });

      it('suggestions list\'s role should be listbox', function() {
        suggestionsList = TestUtils.findRenderedDOMComponentWithClass(autosuggest, 'react-autosuggest__suggestions');
        expect(React.findDOMNode(suggestionsList).getAttribute('role')).toBe('listbox');
      });
    });
  });

  describe('Multiple sections', function() {
    beforeEach(function() {
      createAutosuggest(<Autosuggest suggestions={getMultipleSectionsSuburbs} />);
      findInput();
      setInputValue('m');
    });

    it('should render section names', function() {
      expectSections([null, 'Second section', 'Third section']);
    });
  });

  describe('Misc', function() {
    beforeEach(function() {
      createAutosuggest(<Autosuggest suggestions={getSuburbs} />);
      findInput();
    });

    it('should reset sectionIterator when getting cached suggestions', function() {
      setInputValue('m');
      setInputValue('mz');
      setInputValue('m');
      clickDown();
      expectFocusedSuggestion('Mill Park');
    });
  });
});
