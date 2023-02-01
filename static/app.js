const synth = window.speechSynthesis;
const responseContainer = document.getElementById("response");
const btnenable = document.getElementById("btn-enable");
const btnclear = document.getElementById("btn-clear");
const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
const grammar = '#JSGF V1.0; grammar phrases; public <phrase> = please save the response | do something else;'
const speechRecognitionList = new webkitSpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);
if(localStorage.getItem('AI')){
    var localS = localStorage.getItem('AI');
}
else {
    var localS = '';
}
var localS = localStorage.getItem('AI');
let finalTranscript = "Prompt: " + localS + "You: ";
let recogstatus = 0;
let selectedVoice = 0;
let aiResponse = "";
let aiVoice = "";
//localStorage.setItem('AI', '');
console.log(localS);

recognition.grammars = speechRecognitionList;
recognition.interimResults = false;
recognition.maxAlternatives = 10;
recognition.continuous = false;
recognition.autoGainControl = true;
recognition.noiseSuppression = true;

btnenable.addEventListener("click", enableSpeech);
btnclear.addEventListener("click", clearCache);

populateVoiceList();
if (typeof speechSynthesis !== "undefined" && speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}

recogstatus = 1;
recognition.onresult = function(e) {
    let phrase = "";
    let interimTranscript = "";
    for(let i = e.resultIndex, len = e.results.length; i < len; i++) {
    phrase = e.results[i][0].transcript;
    console.log('Confidence: ' + e.results[i][0].confidence);
    
    let transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
            finalTranscript += transcript;
        } else {
            interimTranscript += transcript;
        }
    }

    recognition.onstart = () => {
        recogstatus = 1;
    }

    recognition.onend = () => {
        document.getElementById("status").style.backgroundColor = "#000000";
    }

    recognition.addEventListener('speechend', () => {
        console.log("Speech has stopped being detected");
    });

    finalTranscript+=" ";
    
    if (e.results[0][0].confidence > 0.80 && phrase == "please save the response"){
        //console.log("I will save the response for you!");
        writeToFile(aiResponse);
        aiSpeak("I will save the response.");
    } else {
        // Send the transcript to the Python script
        fetch("http://localhost:5000/send-text", {
            method: "POST",
            mode: "no-cors",
            headers: new Headers({"Content-Type": "text/html"}),
            body: finalTranscript
            })
            .then(response => {
                return response.text();
            })
            .then(text => {
                console.log(text);
                responseContainer.addEventListener("change", aiSpeak(text));
                finalTranscript += text + " ";
                aiResponse = text;
                if (finalTranscript.length > 3500){
                    finalTranscript = finalTranscript.substring(2000);
                }
                console.log(finalTranscript);
            })
            .catch(error => console.error(error));  // Log any errors to the console
            // Update the page with the response from the Python backend
    }
}

recognition.onnomatch = function(e) {
    console.log = "I didn't recognise that phrase.";
}

function aiSpeak(value) {
    console.log(selectedVoice);
    setTimeout(() => {
        const voiceSelected = document.getElementById("voiceSelect").value;
        const textToSpeak = value;
        const utterThis = new SpeechSynthesisUtterance(textToSpeak);
        utterThis.voice = selectedVoice;
        synth.speak(utterThis);
        console.log("AI: " + textToSpeak);
        console.log("Pending: " + synth.pending + " Speaking: " + synth.speaking);
        console.log("Speech Recognition Disabled for Speech Synthesis");
        disableSpeech();
    }, "2000")
    localStorage.setItem('AI', value);
}

function writeToFile(textToWrite){
    let response = textToWrite;
    document.getElementById("responseP").innerHTML = document.getElementById("responseP").innerHTML + "<b>AIResp:</b>&nbsp;" + response + "<br><br>";
    //alert(response);
}

function enableSpeech(){
    recognition.start();
    console.log("Speech Recognition Enabled");
    document.getElementById("status").style.backgroundColor = "#95fa4d";
}

function disableSpeech(){
    recognition.abort();
    recogstatus = 0;
    console.log(synth.speaking);
}

function checkSpeech(){
    console.log("Speaking... Status: " + synth.speaking);
    console.log(selectedVoice);
    if (aiVoice != ""){
        selectedVoice = aiVoice;
    }
    if (synth.speaking){
        document.getElementById("status").style.backgroundColor = "#fa5b4d";
    } else if (recogstatus == 0){
        enableSpeech();
    }
    recognition.onend = () => {
        document.getElementById("status").style.backgroundColor = "#000000";
    }
}

function selectVoices(){
    const voices = speechSynthesis.getVoices();
    const selectedOption = voiceSelect.selectedOptions[0].getAttribute("data-name");
    for (let i = 0; i < voices.length; i++) {
        if (voices[i].name === selectedOption) {
            selectedVoice = voices[i];
            aiVoice = voices[i];
        }
    }
}

function populateVoiceList() {
    if (typeof speechSynthesis === "undefined") {
        return;
    }

    const voices = speechSynthesis.getVoices();

    for (let i = 0; i < voices.length; i++) {
        const option = document.createElement("option");
        option.textContent = `${voices[i].name} (${voices[i].lang})`;

        if (voices[i].default) {
            option.textContent += " — DEFAULT";
        }

        option.setAttribute("data-lang", voices[i].lang);
        option.setAttribute("data-name", voices[i].name);
        document.getElementById("voiceSelect").appendChild(option);
        const selectedOption = voiceSelect.selectedOptions[0].getAttribute("data-name");
        if (voices[i].name === selectedOption) {
            selectedVoice = voices[i];
        }
    }
}

function clearCache(){
    localStorage.setItem('AI', '');
}

setInterval("checkSpeech()", 1000);