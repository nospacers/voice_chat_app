const synth = window.speechSynthesis;
const responseContainer = document.getElementById("response");
const btnenable = document.getElementById("btn-enable");
const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
let finalTranscript = "You: ";
let recogstatus = 0;
let selectedVoice = 0;

recognition.interimResults = false;
recognition.maxAlternatives = 10;
recognition.continuous = true;
recognition.autoGainControl = true;
recognition.noiseSuppression = true;

btnenable.addEventListener("click", enableSpeech);

populateVoiceList();
if (typeof speechSynthesis !== "undefined" && speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}

recogstatus = 1;
recognition.onresult = function(e) {
    let interimTranscript = "";
    for(let i = e.resultIndex, len = e.results.length; i < len; i++) {
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
            if (finalTranscript.length > 3500){
                finalTranscript = finalTranscript.substring(2000);
            }
            console.log(finalTranscript);
        })
        .catch(error => console.error(error));  // Log any errors to the console
        // Update the page with the response from the Python backend
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
    }, "1000")
}

function enableSpeech(){
    recognition.start();
    console.log("Speech Recognition Enabled");
    document.getElementById("status").style.backgroundColor = "#008000";
}

function disableSpeech(){
    recognition.abort();
    recogstatus = 0;
    console.log(synth.speaking);
}

function checkSpeech(){
    console.log("Speaking... Status: " + synth.speaking);
    if (synth.speaking){
        document.getElementById("status").style.backgroundColor = "#ff0000";
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

setInterval("checkSpeech()", 1000);