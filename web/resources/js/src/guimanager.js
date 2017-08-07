/*Organized as a 'Revealing Module' with namespace jlab.wave*/
(function (jlab) {
    (function (wave) {
        wave.GuiManager = class GuiManager {
            constructor(chartManager, urlManager) {
                let _chartManager = chartManager;
                let _urlManager = urlManager;

                let addPvs = function (pvs) {
                    $("#pv-input").val("");
                    $("#chart-container").css("border", "none");

                    _urlManager.addPvs(pvs);
                    _chartManager.addPvs(pvs);
                };

                /* JQUERY MOBILE GLOBAL TOOLBAR INIT */
                $("#header-panel").toolbar({theme: "a", tapToggle: false});
                $("#footer-panel").toolbar({theme: "a", tapToggle: false});
                $.mobile.resetActivePageHeight();

                /* DATEBOX DATE-TIME PICKER INIT */
                jQuery.extend(jQuery.jtsage.datebox.prototype.options, {
                    'maxDur': 86399,
                    'lockInput': false
                });

                if (jlab.wave.util.hasTouch()) {
                    $("#start-date-input").datebox({mode: "flipbox"});
                    $("#start-time-input").datebox({mode: "durationflipbox", overrideSetDurationButtonLabel: "Set Time", overrideDurationLabel: ["Day", "Hour", "Minute", "Second"], overrideDurationFormat: "%Dl:%DM:%DS", overrideDurationOrder: ['h', 'i', 's']});
                    $("#end-date-input").datebox({mode: "flipbox"});
                    $("#end-time-input").datebox({mode: "durationflipbox", overrideSetDurationButtonLabel: "Set Time", overrideDurationLabel: ["Day", "Hour", "Minute", "Second"], overrideDurationFormat: "%Dl:%DM:%DS", overrideDurationOrder: ['h', 'i', 's']});
                } else {
                    $("#start-date-input").datebox({mode: "calbox"});
                    $("#start-time-input").datebox({mode: "durationbox", overrideSetDurationButtonLabel: "Set Time", overrideDurationLabel: ["Day", "Hour", "Minute", "Second"], overrideDurationFormat: "%Dl:%DM:%DS", overrideDurationOrder: ['h', 'i', 's']});
                    $("#end-date-input").datebox({mode: "calbox"});
                    $("#end-time-input").datebox({mode: "durationbox", overrideSetDurationButtonLabel: "Set Time", overrideDurationLabel: ["Day", "Hour", "Minute", "Second"], overrideDurationFormat: "%Dl:%DM:%DS", overrideDurationOrder: ['h', 'i', 's']});
                }

                /* --- EVENT WIRING --- */

                /* MOUSE EVENTS */

                $(document).on("click", "#pv-info-list a", function () {
                    $("#pv-panel").panel("close");
                });
                $(document).on("click", "#options-button", function () {
                    $("#options-panel").panel("open");
                });
                $(document).on("click", ".cancel-panel-button", function () {
                    $(this).closest(".ui-panel").panel("close");
                    return false;
                });
                $(document).on("click", "#update-options-button", function () {

                    let fetchRequired = false,
                            _options = new wave.ApplicationOptions(),
                            startDateStr = $("#start-date-input").val(),
                            startTimeStr = $("#start-time-input").val(),
                            endDateStr = $("#end-date-input").val(),
                            endTimeStr = $("#end-time-input").val(),
                            startDate = wave.util.parseUserDate(startDateStr),
                            startTime = wave.util.parseUserTime(startTimeStr),
                            endDate = wave.util.parseUserDate(endDateStr),
                            endTime = wave.util.parseUserTime(endTimeStr);

                    _options.start.setFullYear(startDate.getFullYear());
                    _options.start.setMonth(startDate.getMonth());
                    _options.start.setDate(startDate.getDate());
                    _options.start.setHours(startTime.getHours());
                    _options.start.setMinutes(startTime.getMinutes());
                    _options.start.setSeconds(startTime.getSeconds());
                    _options.end.setFullYear(endDate.getFullYear());
                    _options.end.setMonth(endDate.getMonth());
                    _options.end.setDate(endDate.getDate());
                    _options.end.setHours(endTime.getHours());
                    _options.end.setMinutes(endTime.getMinutes());
                    _options.end.setSeconds(endTime.getSeconds());

                    _options.layoutMode = parseInt($("#multiple-pv-mode-select").val());

                    _options.validate();

                    let uri = new URI();
                    uri.setQuery("start", wave.util.toIsoDateTimeString(_options.start));
                    uri.setQuery("end", wave.util.toIsoDateTimeString(_options.end));
                    uri.setQuery("layoutMode", _options.layoutMode);
                    uri.setQuery("viewerMode", _options.viewerMode);
                    window.history.replaceState({}, 'Set start and end', uri.href());

                    _chartManager.setOptions(_options);

                    $("#options-panel").panel("close");
                });
                $(document).on("click", "#pv-visibility-toggle-button", function () {
                    let e = wave.selectedSeries;

                    if (typeof wave.selectedSeries !== 'undefined') {
                        if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                            e.dataSeries.visible = false;
                            $("#pv-visibility-toggle-button").text("Show");
                        } else {
                            e.dataSeries.visible = true;
                            $("#pv-visibility-toggle-button").text("Hide");
                        }

                        e.chart.render();
                    }

                    $("#pv-panel").panel("close");
                });
                $(document).on("click", "#pv-delete-button", function () {
                    let e = wave.selectedSeries;

                    if (typeof wave.selectedSeries !== 'undefined') {
                        _chartManager.removePvs([e.dataSeries.pv]);
                        $("#pv-panel").panel("close");

                    }
                });

                /* KEYBOARD EVENTS */

                $(document).on("keyup", "#pv-input", function (e) {
                    if (e.keyCode === 13) {
                        let input = $.trim($("#pv-input").val());
                        if (input !== '') {
                            /*Replace all commas with space, split on any whitespace, filter out empty strings*/
                            let tokens = input.replace(new RegExp(',', 'g'), " ").split(/\s/).filter(Boolean);

                            addPvs(tokens);
                        }
                        return false; /*Don't do default action*/
                    }
                });

                /* JQUERY MOBILE UI EVENTS */

                $(document).on("panelbeforeopen", "#options-panel", function () {
                    $("#start-date-input").val(wave.util.toUserDateString(_chartManager.getOptions().start));
                    $("#start-time-input").val(wave.util.toUserTimeString(_chartManager.getOptions().start));
                    $("#end-date-input").val(wave.util.toUserDateString(_chartManager.getOptions().end));
                    $("#end-time-input").val(wave.util.toUserTimeString(_chartManager.getOptions().end));
                    $("#multiple-pv-mode-select").val(_chartManager.getOptions().layoutMode).change();
                    $("#viewer-mode-select").val(_chartManager.getOptions().viewerMode).change();
                });

                /* DATEBOX EVENTS */

                /*I want button on right so this is a hack to switch it on pop-up 'open' - todo: just change the damn source code of 3rd-party lib*/
                $(document).on('datebox', function (e, passed) {
                    if (passed.method === 'open') {
                        $(".ui-datebox-container .ui-btn-left").removeClass("ui-btn-left").addClass("ui-btn-right");
                    }
                });
            }
        };
    })(jlab.wave || (jlab.wave = {}));
})(jlab || (jlab = {}));