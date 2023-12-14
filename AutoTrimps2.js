var atSettings = {
    initialise: {
        version: '',
        basepath: 'https://SadAugust.github.io/AutoTrimps/',
        loaded: false
    },
    modules: {
        path: 'modules/',
        installedModules: ['utils', 'other', 'import-export', 'query', 'mapFunctions', 'calc', 'portal', 'upgrades', 'heirloomCalc', 'heirlooms', 'buildings', 'jobs', 'equipment', 'gather', 'stance', 'maps', 'breedtimer', 'combat', 'scryer', 'magmite', 'nature', 'surky', 'perky', 'fight-info', 'performance', 'bones', 'MAZ', 'minigames', 'mutatorPreset', 'farmCalc'],
        externalModules: [],
        loadingModules: [],
        loadedModules: [],
        loaded: []
    },
    updateAvailable: false,
    running: true,
    runInterval: 100,
    portal: { currentworld: 0, lastrunworld: 0, aWholeNewWorld: false, currentHZE: 0, lastHZE: 0, aWholeNewHZE: false },
    loops: { atTimeLapseFastLoop: false, mainLoopInterval: null, guiLoopInterval: null },
    intervals: { counter: 0, oneSecond: false, twoSecond: false, fiveSecond: false, sixSecond: false, tenSecond: false, thirtySecond: false, oneMinute: false, tenMinute: false },
    autoSave: game.options.menu.autoSave.enabled
};

/* 
Loading modules that are required for the script to run. 
*/
function _loadModules(fileName, prefix = '') {
    if (atSettings.modules.loadingModules.includes(fileName)) return;

    var script = document.createElement('script');
    script.src = atSettings.initialise.basepath + prefix + fileName + '.js';
    script.id = fileName + '_MODULE';
    script.async = false;
    script.defer = true;
    document.head.appendChild(script);
    atSettings.modules.loadingModules.push(fileName);
    //Looks for if the script has loaded, if it has, add it to the loadedModules array. Ignores duplicate entries.
    script.addEventListener('load', () => {
        if (prefix !== '' && !atSettings.modules.loadedModules.includes(fileName)) atSettings.modules.loadedModules.push(fileName);
    });
}

//Need to do my best to cull these asap
function _setupGlobalVars() {
    autoTrimpSettings = {};
    MODULES = {
        popups: { challenge: false, respecAtlantrimp: false, remainingTime: Infinity, intervalID: null, portal: false, mazWindowOpen: false },
        stats: { baseMinDamage: 0, baseMaxDamage: 0, baseDamage: 0, baseHealth: 0, baseBlock: 0 },
        graphs: {}
    };

    ATmessageLogTabVisible = true;
    currPortalUniverse = 0;
    currSettingUniverse = 0;
    settingChangedTimeout = false;
    challengeCurrentZone = -1;

    mapSettings = { shouldRun: false, mapName: '', levelCheck: Infinity };
    hdStats = {};
    trimpStats = { isC3: false, isDaily: false, isFiller: false, mountainPriority: false };
}

/*
 * Searches html for where the AT script is being loaded from.
 * This is pretty much only useful for me as I have a local version of AT that I use for testing.
 */
function _setupBasepath() {
    for (var item in document.getElementsByTagName('script')) {
        if (document.getElementsByTagName('script')[item].src.includes('AutoTrimps2')) {
            atSettings.initialise.basepath = document.getElementsByTagName('script')[item].src.replace(/AutoTrimps2\.js$/, '');
            break;
        }
    }

    //The basepath variable is used in graphs, can't remove this while using Quias graphs fork unless I copy code and change that line for every update.
    basepath = atSettings.initialise.basepath;
}

/*
 * Loads jQuery & graphs
 */
function _setupExternalScripts() {
    //Load jQuery
    (function () {
        const script = document.createElement('script');
        script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.7.0/jquery.min.js';
        script.type = 'text/javascript';
        // Append the script to the document
        document.head.appendChild(script);
    })();

    //Loading graphs
    var script = document.createElement('script');
    script.src = 'https://Quiaaaa.github.io/AutoTrimps/Graphs.js';
    document.head.appendChild(script);
}

/*
 * Loads select2+css. Needs to be done after jQuery has loaded.
 */
function _setupExternalScriptsPt2() {
    //Loading jQuery select2 to style dropdown boxes more than basic html/css can.
    var script = document.createElement('link');
    script.rel = 'stylesheet';
    script.href = 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css';
    script.type = 'text/css';
    // Append the script to the document
    document.head.appendChild(script);

    //Loading jQuery select2 to style dropdown boxes more than basic html/css can.
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js';
    script.type = 'text/javascript';
    // Append the script to the document
    document.head.appendChild(script);
}

/*
 * Loads all the modules (bar settingsGUI), jQuery, select2 and global vars
 */
function _initialLoad() {
    console.time();
    _setupBasepath();

    _setupGlobalVars();

    _setupExternalScripts();

    //Implement new div into the offlineWrapper to hold the settings bar we introduce when in offline mode.
    if (document.getElementById('settingsRowTW') === null) {
        var settingBarRow = document.createElement('DIV');
        settingBarRow.setAttribute('id', 'settingsRowTW');
        document.getElementById('offlineWrapper').children[0].insertAdjacentHTML('afterend', '<br>');
        var offlineWrapperParent = document.getElementById('offlineInnerWrapper').parentNode;
        offlineWrapperParent.replaceChild(settingBarRow, document.getElementById('offlineInnerWrapper').parentNode.children[1]);
    }

    _loadModules('versionNumber');
    for (var m in atSettings.modules.installedModules) {
        _loadModules(atSettings.modules.installedModules[m], atSettings.modules.path);
    }

    //Load CSS
    var linkStylesheet = document.createElement('link');
    (linkStylesheet.rel = 'stylesheet'), (linkStylesheet.type = 'text/css'), (linkStylesheet.href = atSettings.initialise.basepath + 'tabs.css'), document.head.appendChild(linkStylesheet);

    //Loads the settings from the save file, settingsGUI & the various modules installed.
    _loadSettingsGUI();
}

function _loadSettingsGUI() {
    //Reload script every 1 milliseconds until the utils module has been loaded.
    if (typeof _setupAutoTrimpsSettings !== 'function' || atSettings.initialise.version === '' || typeof jQuery !== 'function') {
        setTimeout(_loadSettingsGUI, 1);
        return;
    }
    _setupExternalScriptsPt2();
    _setupAutoTrimpsSettings();

    _loadModules('SettingsGUI');
    _loadModifiedFunctions();
}

function _loadModifiedFunctions() {
    if (atSettings.modules.installedModules.length > atSettings.modules.loadedModules.length || typeof updateATVersion !== 'function') {
        setTimeout(_loadModifiedFunctions, 1);
        return;
    }
    _loadModules('modifyGameFunctions', atSettings.modules.path);
    _startAT();
}

//Runs second
function initializeAutoTrimps() {}

_initialLoad();

function _startAT() {
    //Reload script every 10 milliseconds until these scripts have been loaded
    //Added incrementing variable at the end of every script so that we can be sure that the script has fully loaded before we start the main loop.
    if (typeof getHazardGammaBonus_AT !== 'function') {
        setTimeout(_startAT, 1);
        return;
    }

    _raspberryPiSettings();
    //Adds autoMaps, autoJobs, autoStructure, autoEquip buttons to the trimps UI.
    setupATButtons();

    atSettings.initialise.loaded = true;
    MODULES.heirlooms.gammaBurstPct = getHeirloomBonus('Shield', 'gammaBurst') / 100 > 0 ? getHeirloomBonus('Shield', 'gammaBurst') / 100 : 1;
    trimpStats = new TrimpStats(true);
    hdStats = new HDStats(true);
    updateAutoMapsStatus();

    //Copy gameLoop for when we enter toggleCatchUpMode.
    originalGameLoop = gameLoop;

    localStorage.setItem('mutatorPresets', autoTrimpSettings.mutatorPresets.valueU2);
    //Setup Perky/Surky UI
    universeSwapped();
    //Loads my game settings
    loadAugustSettings();
    currSettingUniverse = autoTrimpSettings.universeSetting.value + 1;
    debug(`AutoTrimps (${atSettings.initialise.version.split(' ')[0]} ${atSettings.initialise.version.split(' ')[1]}) finished loading.`);
    challengeInfo(true);

    //Starts the loop in either normal or TimeLapse mode.
    toggleCatchUpMode();
    console.timeEnd();
}

/*
 * Displays Perky UI when changing universes.
 */
function universeSwapped() {
    //Hard to do an alternative to this. Would have linked it to the swapPortalUniverse() function but the force going back to U1 button in U2 causes issues with that.
    //Sets up the proper calc UI when switching between portal universes.
    if (currPortalUniverse !== portalUniverse) {
        if (portalUniverse === -1) portalUniverse = game.global.universe;
        MODULES.autoPerks.displayGUI(portalUniverse);
        currPortalUniverse = portalUniverse;
    }
}

//Starts the main/gui loop and switches to catchup mode if needed also switches back to realtime mode if needed
function toggleCatchUpMode() {
    //Start and Intilise loop if this is called for the first time
    if (!atSettings.loops.mainLoopInterval && !atSettings.loops.guiLoopInterval && !atSettings.loops.atTimeLapseFastLoop) {
        atSettings.loops.mainLoopInterval = setInterval(mainLoop, atSettings.runInterval);
        atSettings.loops.guiLoopInterval = setInterval(guiLoop, atSettings.runInterval * 10);
    }

    //If we have a setting enable that disables TimeLapse mode, then disable running the script running a faster loop in offline mode.
    if (usingRealTimeOffline) {
        if (!getPageSetting('timeWarpSpeed')) {
            if (usingRealTimeOffline && atSettings.loops.atTimeLapseFastLoop) {
                atSettings.loops.atTimeLapseFastLoop = false;
                gameLoop = originalGameLoop;
                debug('Disabled TW settings', 'offline');
                toggleCatchUpMode();
            }
            return;
        }
    }

    //Enable Online Mode after Offline mode was enabled
    if (!usingRealTimeOffline && atSettings.loops.atTimeLapseFastLoop) {
        if (atSettings.loops.mainLoopInterval) clearInterval(atSettings.loops.mainLoopInterval);
        if (atSettings.loops.guiLoopInterval) clearInterval(atSettings.loops.guiLoopInterval);
        atSettings.loops.mainLoopInterval = null;
        atSettings.loops.atTimeLapseFastLoop = false;
        atSettings.loops.guiLoopInterval = null;
        gameLoop = originalGameLoop;
        atSettings.loops.mainLoopInterval = setInterval(mainLoop, atSettings.runInterval);
        atSettings.loops.guiLoopInterval = setInterval(guiLoop, atSettings.runInterval * 10);
    } else if (usingRealTimeOffline && !atSettings.loops.atTimeLapseFastLoop) {
        //Enable Offline Mode
        if (atSettings.loops.mainLoopInterval) {
            clearInterval(atSettings.loops.mainLoopInterval);
            atSettings.loops.mainLoopInterval = null;
        }
        if (atSettings.loops.guiLoopInterval) {
            clearInterval(atSettings.loops.guiLoopInterval);
            atSettings.loops.guiLoopInterval = null;
        }
        atSettings.autoSave = game.options.menu.autoSave.enabled;
        atSettings.loops.atTimeLapseFastLoop = true;
        if (game.options.menu.autoSave.enabled) toggleSetting('autoSave');
        gameLoop = function (makeUp, now) {
            originalGameLoop(makeUp, now);

            if (atSettings.running === false) return;
            if (getPageSetting('pauseScript', 1) || game.options.menu.pauseGame.enabled) return;
            updateInterval();
            var loopFrequency = getPageSetting('timeWarpFrequency');
            mainCleanup();
            if (game.global.mapsActive && getPageSetting('timeWarpDisplay') && usingRealTimeOffline) game.global.mapStarted -= 100;

            //Run mainLoop every n game loops and always on a new zone.
            if (loops % loopFrequency === 0 || atSettings.portal.aWholeNewWorld || checkIfLiquidZone()) {
                mainLoop();
            } else if (atSettings.intervals.thirtySecond) {
                trimpStats = new TrimpStats();
                hdStats = new HDStats();
            }

            //If user want to see the games UI then run this code every 600 game loops.
            if (getPageSetting('timeWarpDisplay') && usingRealTimeOffline && loops % 600 === 0) {
                usingRealTimeOffline = false;
                var enemy = getCurrentEnemy();
                updateGoodBar();
                updateBadBar(enemy);
                document.getElementById('goodGuyHealthMax').innerHTML = prettify(game.global.soldierHealthMax);
                document.getElementById('badGuyHealthMax').innerHTML = prettify(enemy.maxHealth);

                var blockDisplay = '';
                //Prismatic Shield for U2
                if (game.global.universe == 2) {
                    var esMax = game.global.soldierEnergyShieldMax;
                    var esMult = getEnergyShieldMult();
                    var layers = Fluffy.isRewardActive('shieldlayer');
                    if (layers > 0) {
                        esMax *= layers + 1;
                        esMult *= layers + 1;
                    }
                    blockDisplay = prettify(esMax) + ' (' + Math.round(esMult * 100) + '%)';
                }
                //Block for U1
                else blockDisplay = prettify(game.global.soldierCurrentBlock);
                document.getElementById('goodGuyBlock').innerHTML = blockDisplay;
                document.getElementById('goodGuyAttack').innerHTML = calculateDamage(game.global.soldierCurrentAttack, true, true);
                var badAttackElem = document.getElementById('badGuyAttack');
                badAttackElem.innerHTML = calculateDamage(getCurrentEnemy().attack, true, false, false, getCurrentEnemy());

                updateLabels(true);
                displayMostEfficientEquipment();
                usingRealTimeOffline = true;
            }
            //Fix bug that is caused by this not running when the game is in offline mode
            else {
                for (var equipName in game.equipment) {
                    var upgradeName = MODULES.equipment[equipName].upgrade;
                    if (game.upgrades[upgradeName].locked === 1) continue;
                    if (document.getElementById(upgradeName) === null) {
                        drawUpgrade(upgradeName, document.getElementById('upgradesHere'));
                    }
                }
            }
            //Running a few functions everytime the game loop runs to ensure we aren't missing out on any mapping that needs to be done.
            farmingDecision();
            autoMap();
            callBetterAutoFight();
            autoPortalCheck();
            if (loops % 10 === 0 || atSettings.portal.aWholeNewWorld) updateAutoMapsStatus();
            if (game.global.universe === 1) checkStanceSetting();
            if (game.global.universe === 2) equalityManagement();
            guiLoop();
        };

        debug('TimeLapse Mode Enabled', 'offline');
        if (usingRealTimeOffline) {
            var timeWarpTime = offlineProgress.formatTime(Math.floor(offlineProgress.totalOfflineTime / 1000));
            debug(`Your Time Warp duration is ${timeWarpTime}.`);
            if (getPageSetting('timeWarpDisplay')) tooltip(`Time Warp`, `customText`, `lock`, `Your Time Warp duration is ${timeWarpTime}. As you have the ${autoTrimpSettings.timeWarpDisplay.name()} setting enabled you have no visible timer but you can see the progress percent in the AutoMaps status bar at the bottom of the battle container.`, false, `center`);
        }
    }
}

//Offline mode check
function shouldRunInTimeWarp() {
    return !atSettings.loops.atTimeLapseFastLoop || (usingRealTimeOffline && !getPageSetting('timeWarpSpeed'));
}

function updateInterval() {
    atSettings.intervals.counter++;
    //Interval code
    atSettings.intervals.oneSecond = atSettings.intervals.counter % (1000 / atSettings.runInterval) === 0;
    atSettings.intervals.twoSecond = atSettings.intervals.counter % (2000 / atSettings.runInterval) === 0;
    atSettings.intervals.fiveSecond = atSettings.intervals.counter % (5000 / atSettings.runInterval) === 0;
    atSettings.intervals.sixSecond = atSettings.intervals.counter % (6000 / atSettings.runInterval) === 0;
    atSettings.intervals.tenSecond = atSettings.intervals.counter % (10000 / atSettings.runInterval) === 0;
    atSettings.intervals.thirtySecond = atSettings.intervals.counter % (30000 / atSettings.runInterval) === 0;
    //Need a ten minute interval for version checking.
    atSettings.intervals.oneMinute = atSettings.intervals.counter % (60000 / atSettings.runInterval) === 0;
    atSettings.intervals.tenMinute = atSettings.intervals.counter % 60000 === 0;
}

function mainLoop() {
    //Toggle between timelapse/catchup/offline speed and normal speed.
    toggleCatchUpMode();
    //Adjust tooltip when mazWindow is open OR clear our adjustments if it's not.
    //Need to identify a better solution to this. Not really sure what I can do though.
    if (MODULES.popups.mazWindowOpen) {
        const mazSettings = ['Map Farm', 'Map Bonus', 'Void Map', 'HD Farm', 'Raiding', 'Bionic Raiding', 'Balance Destack', 'Toxicity', 'Quagmire', 'Insanity', 'Alchemy', 'Hypothermia', 'Bone Shrine', 'Auto Golden', 'Tribute Farm', 'Smithy Farm', 'Worshipper Farm', 'Desolation Gear Scumming', 'C2 Runner', 'C3 Runner'];
        var tipElem = document.getElementById('tooltipDiv');

        if (mazSettings.indexOf(tipElem.children.tipTitle.innerText) === -1) {
            tipElem.style.overflowY = '';
            tipElem.style.maxHeight = '';
            tipElem.style.width = '';
            MODULES.popups.mazWindowOpen = false;
        }
    }

    remakeTooltip();
    universeSwapped();

    if (atSettings.running === false) return;
    if (getPageSetting('pauseScript', 1) || game.options.menu.pauseGame.enabled) return;
    atSettings.running = true;
    if (shouldRunInTimeWarp()) updateInterval();
    if (atSettings.intervals.tenMinute) atVersionChecker();

    //This needs to be run here so that any variables that are reset at the start of a zone are reset before hdStats and mapSettings variables are updated.
    if (shouldRunInTimeWarp()) mainCleanup();

    if (atSettings.intervals.oneSecond) {
        trimpStats = new TrimpStats();
        hdStats = new HDStats();
    }
    if (shouldRunInTimeWarp()) farmingDecision();
    if (MODULES.maps.slowScumming && game.global.mapRunCounter !== 0) {
        if (game.global.mapBonus === 10) MODULES.maps.slowScumming = false;
        else {
            slowScum();
            return;
        }
    }

    //Heirloom Shield Swap Check
    if (MODULES.heirlooms.shieldEquipped !== game.global.ShieldEquipped.id) heirloomShieldSwapped();

    if (shouldRunInTimeWarp()) {
        //AutoMaps
        autoMap();
        updateAutoMapsStatus();
    }
    //Status
    //Gather
    autoGather();
    //Auto Traps
    if (getPageSetting('TrapTrimps') && game.global.trapBuildAllowed && !game.global.trapBuildToggled) toggleAutoTrap();
    //Buildings
    buyBuildings();
    //Jobs
    buyJobs();
    //Upgrades
    buyUpgrades();
    //Heirloom Management
    heirloomSwapping();
    //Combat
    callBetterAutoFight();
    //Bone Shrine
    boneShrine();
    //Auto Golden Upgrade
    autoGoldUpgrades();
    //AutoEquip
    autoEquip();

    //Portal
    if (shouldRunInTimeWarp()) autoPortalCheck();
    //Equip highlighting
    if (shouldRunInTimeWarp()) displayMostEfficientEquipment();

    //Logic for Universe 1
    mainLoopU1();

    //Logic for Universe 2
    mainLoopU2();

    //Bone purchases
    buySingleRunBonuses();

    //Auto SA -- Currently disabled
    automateSpireAssault();

    challengeInfo();

    if (MODULES.popups.remainingTime === 5000) {
        MODULES.popups.remainingTime -= 0.0001;
        MODULES.popups.intervalID = setInterval(function () {
            if (MODULES.popups.remainingTime === Infinity) clearInterval(MODULES.popups.intervalID);
            MODULES.popups.remainingTime -= 100;
            if (MODULES.popups.remainingTime <= 0) MODULES.popups.remainingTime = 0;
        }, 100);
    }

    //Void, AutoLevel, Breed Timer, Tenacity information
    makeAdditionalInfo();
}

//U1 functions
function mainLoopU1() {
    if (game.global.universe !== 1) return;
    //Core
    geneAssist();
    autoRoboTrimp();
    autoEnlight();
    autoNatureTokens();
    if (getPageSetting('spendmagmite') === 2 && !settingChangedTimeout) autoMagmiteSpender();
    autoGenerator();
    //Stance
    if (shouldRunInTimeWarp()) checkStanceSetting();
    //Spire. Exit cell & respec
    if (game.global.spireActive) {
        exitSpireCell();
        atlantrimpRespecMessage();
    }
    fluffyEvolution();
}

//U2 functions
function mainLoopU2() {
    if (game.global.universe !== 2) return;
    //Auto Equality Management
    if (shouldRunInTimeWarp()) equalityManagement();
}

function guiLoop() {
    getPageSetting('displayEnhancedGrid') && MODULES.fightinfo.Update(), 'undefined' !== typeof MODULES && 'undefined' !== typeof MODULES.performance && MODULES.performance.isAFK && MODULES.performance.UpdateAFKOverlay();
}

function mainCleanup() {
    atSettings.portal.lastrunworld = atSettings.portal.currentworld;
    atSettings.portal.currentworld = game.global.world;
    atSettings.portal.aWholeNewWorld = atSettings.portal.lastrunworld !== atSettings.portal.currentworld;

    atSettings.portal.lastHZE = atSettings.portal.currentHZE;
    atSettings.portal.currentHZE = game.global.universe === 2 ? game.stats.highestRadLevel.valueTotal() : game.stats.highestLevel.valueTotal();
    atSettings.portal.aWholeNewHZE = atSettings.portal.lastHZE !== atSettings.portal.currentHZE;

    //If we reached a new HZE check if we have any challenge message popups to display
    //Update settings displayed as well so that any requirements that have now been reached are displayed.
    if (atSettings.portal.aWholeNewHZE) {
        challengeUnlockCheck();
        if (atSettings.portal.lastHZE !== 0) updateCustomButtons(true);
    }
    //If in a new zone then run this code
    if (atSettings.portal.aWholeNewWorld) {
        autoPortalCheck();
        archaeologyAutomator();
        //If in Z1 then we can assume we have just portaled.
        if (atSettings.portal.currentworld === 1) {
            MODULES.mapFunctions.afterVoids = false;
            MODULES.portal.zonePostpone = 0;
            if (!game.upgrades.Battle.done) {
                resetSettingsPortal();
            }
        }
        //Reset any module vars that need reset.
        //Should probably be moved to a seperate function.
        //Maybe house all of the initial module vars in autoTrimps.js and then call a function to reset them all?
        resetVarsZone();
        //Puts the zone number in the title
        setTitle();

        //Debug messages for new zones
        //Ones for just starting a zone, imp count or checking total pop & bone charge resources.
        debug('Starting Zone ' + game.global.world, 'zone');
        debug('Zone #' + game.global.world + ': Tauntimp (' + game.unlocks.impCount.Tauntimp + '), Magnimp (' + game.unlocks.impCount.Magnimp + '), Whipimp (' + game.unlocks.impCount.Whipimp + '), Venimp (' + game.unlocks.impCount.Venimp + ')', 'exotic');
        debug('Zone # ' + game.global.world + ': Total pop (' + prettify(game.resources.trimps.owned) + '). A Bone Charge would give you these resources (' + boneShrineOutput(1).slice(0, -1).toLowerCase() + ')', 'run_Stats');

        //If the Easter event is active then click eggs.
        if (getPageSetting('autoEggs', 1)) easterEggClicked();

        //If inside a daily and the odd/even setting is enabled then print a message to the chatlog if mapping on this zone will be skipped.
        if (dailyOddOrEven().skipZone) {
            debug('Zone #' + game.global.world + ':  Heirloom swapping and mapping will be affected by Daily Odd/Even.', 'daily');
        }
        //Fix for prestige equipment not having updated costs when breaking planet (z59>z60).
        if (usingRealTimeOffline && game.global.world === 60) {
            for (var equipName in game.equipment) {
                var upgradeName = MODULES.equipment[equipName].upgrade;
                if (game.upgrades[upgradeName].locked === 1) continue;
                if (document.getElementById(upgradeName) === null) {
                    drawUpgrade(upgradeName, document.getElementById('upgradesHere'));
                }
            }
        }
    }
}

function throwErrorfromMain() {
    throw new Error('We have successfully read the thrown error message out of the main file');
}

function atVersionChecker() {
    //Don't check for updates if we already know we're behind
    if (atSettings.updateAvailable) return;
    var url = basepath + '/versionNumber.js';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var response = xhr.responseText;
            var version = response.split("'")[1];
            if (version !== atSettings.initialise.version) {
                //Reload the window if the user has the setting enabled and an update is available.
                if (getPageSetting('updateReload')) {
                    save(false, true);
                    location.reload();
                }

                atSettings.updateAvailable = true;
                var changeLogBtn = document.getElementById('atChangelog');
                if (changeLogBtn !== null) {
                    //changeLogBtn.classList.add("mystyle");
                    changeLogBtn.innerHTML += " <span style='color: red; font-weight: bold;'>Update Available!</span>";
                }
            }
        }
    };
    xhr.send();
}
