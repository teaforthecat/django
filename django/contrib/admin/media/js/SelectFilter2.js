/*
SelectFilter2 - Turns a multiple-select box into a filter interface.

Different than SelectFilter because this is coupled to the admin framework.

Requires core.js, SelectBox.js and addevent.js.
*/

function findForm(node) {
    // returns the node of the form containing the given node
    if (node.tagName.toLowerCase() != 'form') {
        return findForm(node.parentNode);
    }
    return node;
}

var SelectFilter = {
    init: function(field_id, field_name, is_stacked, admin_media_prefix) {
        if (field_id.match(/__prefix__/)){
            // Don't intialize on empty forms.
            return;
        }
        var from_box = document.getElementById(field_id);

        // Create a clone to keep the actual values to be sent with the form
        var actual_box = $(from_box).clone().insertBefore(from_box).hide();

        from_box.id += '_from';
        from_box.name += '_from';
        from_box.className = 'filtered';

        var ps = from_box.parentNode.getElementsByTagName('p');
        for (var i=0; i<ps.length; i++) {
            if (ps[i].className.indexOf("info") != -1) {
                // Remove <p class="info">, because it just gets in the way.
                from_box.parentNode.removeChild(ps[i]);
            } else if (ps[i].className.indexOf("help") != -1) {
                // Move help text up to the top so it isn't below the select
                // boxes or wrapped off on the side to the right of the add
                // button:
                from_box.parentNode.insertBefore(ps[i], from_box.parentNode.firstChild);
            }
        }

        // <div class="selector"> or <div class="selector stacked">
        var selector_div = quickElement('div', from_box.parentNode);
        selector_div.className = is_stacked ? 'selector stacked' : 'selector';

        // <div class="selector-available">
        var selector_available = quickElement('div', selector_div, '');
        selector_available.className = 'selector-available';
        quickElement('h2', selector_available, interpolate(gettext('Available %s'), [field_name]));
        var filter_p = quickElement('p', selector_available, '');
        filter_p.className = 'selector-filter';

        var search_filter_label = quickElement('label', filter_p, '', 'for', field_id + "_input", 'style', 'width:16px;padding:2px');

        var search_selector_img = quickElement('img', search_filter_label, '', 'src', admin_media_prefix + 'img/admin/selector-search.gif');
        search_selector_img.alt = gettext("Filter");

        filter_p.appendChild(document.createTextNode(' '));

        var filter_input = quickElement('input', filter_p, '', 'type', 'text');
        filter_input.id = field_id + '_input';
        selector_available.appendChild(from_box);
        var choose_all = quickElement('a', selector_available, gettext('Add all'), 'href', 'javascript: (function(){ SelectBox.move_all("' + field_id + '_from", "' + field_id + '_to"); SelectFilter.refresh_state("' + field_id + '");})()', 'id', field_id + '_add_all_link');
        choose_all.className = 'selector-chooseall';

        // <ul class="selector-chooser">
        var selector_chooser = quickElement('ul', selector_div, '');
        selector_chooser.className = 'selector-chooser';
        var add_link = quickElement('a', quickElement('li', selector_chooser, ''), gettext('Add'), 'title', gettext('Add'), 'href', 'javascript: (function(){ SelectBox.move("' + field_id + '_from","' + field_id + '_to"); SelectFilter.refresh_state("' + field_id + '");})()', 'id', field_id + '_add_link');
        add_link.className = 'selector-add';
        var remove_link = quickElement('a', quickElement('li', selector_chooser, ''), gettext('Remove'), 'title', gettext('Remove'), 'href', 'javascript: (function(){ SelectBox.move("' + field_id + '_to","' + field_id + '_from"); SelectFilter.refresh_state("' + field_id + '");})()', 'id', field_id + '_remove_link');
        remove_link.className = 'selector-remove';

        // <div class="selector-chosen">
        var selector_chosen = quickElement('div', selector_div, '');
        selector_chosen.className = 'selector-chosen';
        var title_chosen = quickElement('h2', selector_chosen, interpolate(gettext('Added %s') + ' ', [field_name]));
        quickElement('img', title_chosen, '', 'src', admin_media_prefix + 'img/icon-unknown.gif', 'width', '10', 'height', '10', 'class', 'help help-tooltip', 'title', interpolate(gettext('This is the list of added %s. You may remove some by selecting them below and then clicking the "Remove" button.'), [field_name]));

        var to_box = quickElement('select', selector_chosen, '', 'id', field_id + '_to', 'multiple', 'multiple', 'size', from_box.size, 'name', actual_box.attr('name') + '_to');
        to_box.className = 'filtered';
        var clear_all = quickElement('a', selector_chosen, gettext('Remove all'), 'href', 'javascript: (function() { SelectBox.move_all("' + field_id + '_to", "' + field_id + '_from"); SelectFilter.refresh_state("' + field_id + '");})()', 'id', field_id + '_remove_all_link');
        clear_all.className = 'selector-clearall';

        // Set up the JavaScript event handlers for the select box filter interface
        addEvent(filter_input, 'keyup', function(e) { SelectFilter.filter_key_up(e, field_id); });
        addEvent(filter_input, 'keydown', function(e) { SelectFilter.filter_key_down(e, field_id); });
        addEvent(from_box, 'change', function(e) { SelectFilter.refresh_icons(field_id); });
        addEvent(to_box, 'change', function(e) { SelectFilter.refresh_icons(field_id); });
        addEvent(from_box, 'dblclick', function() { SelectBox.move(field_id + '_from', field_id + '_to'); SelectFilter.refresh_state(field_id); });
        addEvent(to_box, 'dblclick', function() { SelectBox.move(field_id + '_to', field_id + '_from'); SelectFilter.refresh_state(field_id); });

        SelectBox.init(field_id + '_from');
        SelectBox.init(field_id + '_to');
        // Move selected from_box options to to_box
        SelectBox.move(field_id + '_from', field_id + '_to');

        if (!is_stacked) {
            // In horizontal mode, give the same height to the two boxes.
            $(to_box).height($(filter_p).outerHeight() + $(from_box).outerHeight());
        }

        // Initial state refresh
        SelectFilter.refresh_state(field_id);
    },
    refresh_icons: function(field_id) {
        var from = $('#' + field_id + '_from');
        var to = $('#' + field_id + '_to');
        var is_from_selected = from.find('option:selected').length > 0;
        var is_to_selected = to.find('option:selected').length > 0;
        // Active if at least one item is selected
        $('#' + field_id + '_add_link').toggleClass('active', is_from_selected);
        $('#' + field_id + '_remove_link').toggleClass('active', is_to_selected);
        // Active if the corresponding box isn't empty
        $('#' + field_id + '_add_all_link').toggleClass('active', from.find('option').length > 0);
        $('#' + field_id + '_remove_all_link').toggleClass('active', to.find('option').length > 0);
    },
    refresh_state: function(field_id) {
        SelectFilter.refresh_icons(field_id);

        // Re-generate the content of the actual, hidden, box.
        var actual_box = document.getElementById(field_id);

        // Clear all options.
        actual_box.options.length = 0;

        var node, i;
        var cache_to = SelectBox.cache[field_id + '_to'];
        var cache_from = SelectBox.cache[field_id + '_from'];

        // Add all options from the 'to' box and select them.
        for (i = 0; i < cache_to.length; i++) {
            node = cache_to[i];
            actual_box.options[actual_box.options.length] = new Option(node.text, node.value, false, true);
        }
        // Add all options from the 'from' box and keep them unselected.
        for (i = 0; i < cache_from.length; i++) {
            node = cache_from[i];
            actual_box.options[actual_box.options.length] = new Option(node.text, node.value, false, false);
        }
    },
    filter_key_up: function(event, field_id) {
        from = document.getElementById(field_id + '_from');
        // don't submit form if user pressed Enter
        if ((event.which && event.which == 13) || (event.keyCode && event.keyCode == 13)) {
            from.selectedIndex = 0;
            SelectBox.move(field_id + '_from', field_id + '_to');
            from.selectedIndex = 0;
            return false;
        }
        var temp = from.selectedIndex;
        SelectBox.filter(field_id + '_from', document.getElementById(field_id + '_input').value);
        from.selectedIndex = temp;
        return true;
    },
    filter_key_down: function(event, field_id) {
        from = document.getElementById(field_id + '_from');
        // right arrow -- move across
        if ((event.which && event.which == 39) || (event.keyCode && event.keyCode == 39)) {
            var old_index = from.selectedIndex;
            SelectBox.move(field_id + '_from', field_id + '_to');
            from.selectedIndex = (old_index == from.length) ? from.length - 1 : old_index;
            return false;
        }
        // down arrow -- wrap around
        if ((event.which && event.which == 40) || (event.keyCode && event.keyCode == 40)) {
            from.selectedIndex = (from.length == from.selectedIndex + 1) ? 0 : from.selectedIndex + 1;
        }
        // up arrow -- wrap around
        if ((event.which && event.which == 38) || (event.keyCode && event.keyCode == 38)) {
            from.selectedIndex = (from.selectedIndex == 0) ? from.length - 1 : from.selectedIndex - 1;
        }
        return true;
    }
}
