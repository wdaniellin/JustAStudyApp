import { useState, useEffect } from "react";
import "./App.css";
import { getCurrentWindow } from "@tauri-apps/api/window"; //import lets changing of window
import clickSound from "./assets/click.mp3"; //.mp3
import finishSound from "./assets/timerFinish.mp3"; //.mp3
import crumpleSound from "./assets/crumple.mp3"; //.mp3



function App() {
  
  //Timer states
  const [minutes, setMinutes] = useState<number>(30);
  const [seconds, setSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isBreakMode, setIsBreakMode] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("timer"); //for settings tabs

  const [isClickMuted, setIsClickMuted] = useState<boolean>(false); //use for all soundfx
  const [isFinishMuted, setIsFinishMuted] = useState<boolean>(false); //use for the finish sound

  //allow input for minutes, seconds
  const [config, setConfig] = useState({ focusMin: 30, focusSec: 0, breakMin: 5, breakSec: 0});

  /*Main function that handles countdown, as well as changing the title of window
  (tab) depending on the remaining time left on the timer when active,
   using useEffect(), build into react)*/
  useEffect(() => {
    

    //declare string out of the remaining time
    const timeString = `${formatTime(minutes)}:${formatTime(seconds)}`;
    let newTitle = ''; //make empty string

    if(isActive){
      if(isBreakMode) newTitle =  '[' + timeString + '] Break';
      else newTitle =  '[' + timeString + '] Study';
    }
    else{
      newTitle = 'JustAStudyApp';
    }
    

    //set title of doccument to the string
    document.title = newTitle;
    
    //Web Guard: Only attempt to update the Tauri desktop window frame title if running inside Tauri
    if ((window as any).__TAURI_INTERNALS__) {
      const appWindow = getCurrentWindow();
      appWindow.setTitle(newTitle).catch((err) => console.error(err));
    }
    
    //counting interval
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        //increment second upon end
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } 

        else if (seconds === 0) {
          if (minutes === 0) {
            //swap modes when time runs out
            setIsActive(false);
            playFinish();

            if (!isBreakMode) {
              setIsBreakMode(true);
              setMinutes(config.breakMin);
              setSeconds(config.breakSec);
            } 
            else {
              setIsBreakMode(false);
              setMinutes(config.focusMin); //switch to focus preset
              setSeconds(config.focusSec);
            }
          }
          //count down minutes once seconds are all done
          else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, isBreakMode, config]);


  //method for toggling states
  const toggleTimer = () => setIsActive(!isActive);
  
  //method for resetting timer (resets to values set in the options menu)
  const resetTimer = () => {
    //let user set later
    setIsActive(false);
    if(isBreakMode){
      setMinutes(config.breakMin);
      setSeconds(config.breakSec);
    }
    else{
      setMinutes(config.focusMin);
      setSeconds(config.focusSec);
    }
  };

  //can make these two functions one later
  //function switching to FOCUS
  const switchToFocus = () => {
    setIsActive(false);
    setIsBreakMode(false);
    setMinutes(config.focusMin);
    setSeconds(config.focusSec);
  };

  //method switching to BREAK
  const switchToBreak = () => {
    setIsActive(false);
    setIsBreakMode(true);
    setMinutes(config.breakMin);
    setSeconds(config.breakSec);
  };

  //format numbers to keep digits looking clean (e.g., "05" instead of "5")
  const formatTime = (num: number) => String(num).padStart(2, "0");

  //plays click sound
  const playClick = () => {
    if(isClickMuted) return; //return nothing immediately if muted
    const audio = new Audio(clickSound);
    audio.volume = 0.5; //
    audio.play().catch((err) => console.log("Audio blocked until interaction:", err));
  };

  const playFinish = () => {
    if(isFinishMuted) return; //return nothing immediately if muted
    const audio = new Audio(finishSound);
    audio.volume = 0.5; 
    audio.play().catch((err) => console.log("Audio blocked until interaction:", err));
  };
  const playCrumple = () => {
    if(isClickMuted) return; //return nothing immediately if muted
    const audio = new Audio(crumpleSound);
    audio.volume = 0.5; // 
    audio.play().catch((err) => console.log("Audio blocked until interaction:", err));
  };


  //yay actual html part
  //clean up the options screen heavily after
  return (
    
    <div className={`appContainer ${isBreakMode ? "break-theme" : "study-theme"}`}>

      {/*options menu overlay first bc it goes before the rest of the site */}
      <div className={`options-overlay ${isMenuOpen ? "menu-active" : ""}`}>
        <div className="menu-window-card">
          
          {/*Left nav bar*/}
          <div className="menu-sidebar">
            <div className="sidebar-brand">options ^•𖥦•^</div>
            <div className="sidebar-menu-list">
              <button 
                className={`sidebar-nav-btn ${activeTab === "timer" ? "active" : ""}`}
                onClick={() => {setActiveTab("timer"); }}    
              >
                timer
              </button>
              <button 
                className={`sidebar-nav-btn ${activeTab === "themes" ? "active" : ""}`}
                onClick={() => setActiveTab("themes")}
              >
                themes
              </button>
              <button 
                className={`sidebar-nav-btn ${activeTab === "credits" ? "active" : ""}`}
                onClick={() => setActiveTab("credits")}
              >
                credits
              </button>
            </div>
          </div>

          {/* Right Content Workspace Frame */}
          <div className="menu-content-frame">
            <div className="menu-header-row">
              <button className="menu-close-x-btn" onClick={() => {setIsMenuOpen(false); playCrumple()}} >x</button>
            </div>
            
            <div className="menu-tab-body">
              {activeTab === "timer" && (
                <div className="settings-panel-fade-in">
                  <div className="setting-row">
                    {/* for the focus settings*/}
                    <label className="setting-label">Study Interval</label>
                    <div className="setting-inputs-wrapper">
                      <div className="input-field-container">
                        <input //minutes, max and min caps the scrollable number ammount 
                          type="number" 
                          min="0" 
                          max="180" 
                          placeholder="Min"
                          value={config.focusMin}
                          onChange={(e) => {
                            //make temporary variable val, and change it
                            let val = Number(e.target.value);
                            if (val < 0) val = 0; if (val > 180) val = 180;
                            //set config
                            setConfig({ ...config, focusMin: val });
                            //set the minutes if the conditions are correct
                            if (!isActive && !isBreakMode) setMinutes(val);
                          }}
                        />
                        <span className="input-unit-label">Min</span>
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.3)" }} className="setting-colon">:</span>
                      <div className="input-field-container">
                        <input //seconds
                          type="number" 
                          min="0" 
                          max="59" 
                          placeholder="Sec"
                          value={config.focusSec}
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (val < 0) val = 0; if (val > 59) val = 59;
                            setConfig({ ...config, focusSec: val });
                            if (!isActive && !isBreakMode) setSeconds(val);
                          }}
                        />
                        <span className="input-unit-label">Sec</span>
                      </div>
                    </div>
                  </div>
              

                  <div className="settings-panel-row-divider"></div>

                  {/* for the break settings (exactly the same as the study settings)*/}
                  <div className="setting-row">
                    <label className="setting-label">Break Interval</label>
                    <div className="setting-inputs-wrapper">
                      <div className="input-field-container">
                        <input 
                          type="number" 
                          min="0"
                          max="60"
                          placeholder="Min"
                          value={config.breakMin}
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (val < 0) val = 0; if (val > 60) val = 60;
                            setConfig({ ...config, breakMin: val });
                            if (!isActive && isBreakMode) setMinutes(val);
                          }}
                        />
                        <span className="input-unit-label">Min</span>
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.3)" }} className="setting-colon">:</span>
                      <div className="input-field-container">
                        <input 
                          type="number" 
                          min="0"
                          max="59"
                          placeholder="Sec"
                          value={config.breakSec}
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (val < 0) val = 0; if (val > 59) val = 59;
                            setConfig({ ...config, breakSec: val });
                            if (!isActive && isBreakMode) setSeconds(val);
                          }}
                        />
                        <span className="input-unit-label">Sec</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="settings-panel-row-divider"></div>

                  {/*sound effect toggle*/}
                  <div className="setting-row">
                    <label className="setting-label">Mute Clicks</label>
                    <div className="setting-inputs-wrapper" style={{ paddingRight: "10px" }}>
                      <input 
                        type="checkbox"
                        checked={isClickMuted}
                        style={{ cursor: "pointer", width: "16px", height: "18px" }}
                        onChange={(e) => setIsClickMuted(e.target.checked)}
                      />
                    </div>
                  </div>

                  {/*finish sound effect toggle*/}
                  <div className="setting-row">
                    <label className="setting-label">Mute Alarm</label>
                    <div className="setting-inputs-wrapper" style={{ paddingRight: "10px" }}>
                      <input 
                        type="checkbox"
                        checked={isFinishMuted}
                        style={{ cursor: "pointer", width: "16px", height: "18px" }}
                        onChange={(e) => setIsFinishMuted(e.target.checked)}
                      />
                    </div>
                  </div>
                </div>
                

                
              )}

              {activeTab === "themes" && (
                <div className="settings-panel-fade-in empty-panel-text">
                  Theme settings coming soon...
                </div>
              )}

              {activeTab === "credits" && (

                <div className="settings-panel-fade-in empty-panel-text">
                  {/*change text formatting later lol*/}
                  Created as a week-long summer project using React and Tauri. UI designed 
                  on figma. Fully open-source.
                  
                  Check out my github <a href="https://github.com/cryogopher" target = "_blank"> @cryogopher</a>!! - by Daniel L.
                  Version: 0.1v
                </div>
              )}
            </div>
          </div>

        </div>
      </div>


      {/*actual timer portion (MAIN)*/}
      <div className="mainContent">

        {/*break/focus change buttons*/}
        <div className={`modeIndicator ${isActive ? "faded-out" : ""}`}>
          <button 
            className={`mode-tab ${!isBreakMode ? "active-tab" : ""}`} 
            onClick={switchToFocus}
          >
            Study
          </button>
          <span className="tab-divider">|</span>
          <button 
            className={`mode-tab ${isBreakMode ? "active-tab" : ""}`} 
            onClick={switchToBreak}
          >
            Break
          </button>
        </div>

        <div className={`timerDisplay ${isActive ? "timerFadeIn" : ""}`}>
          {formatTime(minutes)}:{formatTime(seconds)}
        </div>

        {/*fade buttons */}
        
        {/*pause/start button*/}
        <div className={`controls ${isActive ? "faded-out" : ""}`}>
          <button className="controlButton mainAction" onClick={() => { playClick(); toggleTimer(); }}>            {isActive ? "pause" : "start"}
            {/*change it later so that it becomes resume instead of start*/}
          </button>

        {/*reset button*/}
          <button className="controlButton resetAction" onClick={() => { playClick(); resetTimer(); }}>            <svg viewBox="0 0 24 24" className="resetIcon">
              <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
            </svg>
          </button>
        </div>
      </div>

      {/*credits text (on left) */}
      <div className={`branding ${isActive ? "faded-out" : ""}`}>
        JustAStudyApp
        <span className="author">Daniel L.</span>
      </div>

      {/*options button*/}
      <div className={`optionsContainer ${isActive ? "faded-out" : ""}`}>
        <button className="controlButton options-action" onClick={() => { playCrumple(); setIsMenuOpen(true); }}>          <svg viewBox="0 0 24 24" className="options-icon">
            <path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.47,5.34 14.86,5.08L14.47,2.42C14.43,2.18 14.22,2 13.97,2H9.97C9.72,2 9.51,2.18 9.47,2.42L9.08,5.08C8.47,5.34 7.9,5.66 7.38,6.05L4.89,5.05C4.67,4.96 4.4,5.05 4.27,5.27L2.27,8.73C2.15,8.95 2.2,9.22 2.39,9.37L4.5,11C4.46,11.34 4.43,11.67 4.43,12C4.43,12.33 4.46,12.65 4.5,12.97L2.39,14.63C2.2,14.78 2.15,15.05 2.27,15.27L4.27,18.73C4.4,18.95 4.67,19.04 4.89,18.95L7.38,17.95C7.9,18.34 8.47,18.66 9.08,18.92L9.47,21.58C9.51,21.82 9.72,22 9.97,22H13.97C14.22,22 14.43,21.82 14.47,21.58L14.86,18.92C15.47,18.66 16.04,18.34 16.56,17.95L19.05,18.95C19.27,19.04 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
          </svg>
        </button>
      </div>

    </div>
  );
}

export default App;

//npm run tauri dev 
