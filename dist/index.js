"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function validateAPIKey(apiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((res, _) => fetch(`https://api.mapy.cz/v1/timezone/list-timezones?apikey=${apiKey}`)
            .then((d) => d.json())
            .then((d) => res(!!(d === null || d === void 0 ? void 0 : d['timezones']))));
    });
}
let apiKey = null;
(() => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    while (true) {
        apiKey = prompt('Zadejte API klíč od Mapy.cz');
        if (apiKey == null ||
            apiKey.length === 0 ||
            !(yield validateAPIKey(apiKey)))
            continue;
        break;
    }
    (_a = document.querySelector('#root')) === null || _a === void 0 ? void 0 : _a.classList.remove('hidden');
}))();
const fileSelect = document.querySelector('#fileinput');
const log = document.querySelector('#log');
const downloadBtn = document.querySelector('#download');
function printLog(message, isError = false) {
    if (!log)
        return;
    const paragraph = document.createElement('p');
    if (isError)
        paragraph.style.color = 'red';
    paragraph.innerText = message;
    log.appendChild(paragraph);
}
const HAS_HEADER = true;
// const API_KEY = '<klic>';
const API_PATH = 'https://api.mapy.cz/v1/geocode';
function getCoords(address) {
    return new Promise((res, rej) => {
        fetch(API_PATH + `?apikey=${apiKey}&query="${address}"&lang=cs&limit=1`)
            .then((d) => d.json())
            .then((d) => {
            var _a, _b;
            res(((_b = (_a = d === null || d === void 0 ? void 0 : d['items']) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b['position']) || null);
        });
    });
}
const createWpt = (coords, name, description) => {
    const wpt = document.createElement('wpt');
    wpt.setAttribute('lat', coords.lat.toString());
    wpt.setAttribute('lon', coords.lon.toString());
    const nameEl = document.createElement('name');
    nameEl.innerText = name;
    const descEl = document.createElement('desc');
    descEl.innerText = description;
    wpt.appendChild(nameEl);
    wpt.appendChild(descEl);
    return wpt;
};
function createGPX() {
    const boilerplate = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
  <gpx version="1.1" creator="Microrisc Map tool" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  </gpx>`;
    const parser = new DOMParser();
    const xml = parser.parseFromString(boilerplate, 'text/xml');
    return xml;
}
let resultGPX = '';
function handleRows(rows) {
    return __awaiter(this, void 0, void 0, function* () {
        if (rows.length === 0)
            return;
        const gpx = createGPX();
        const gpxBody = gpx.querySelector('gpx');
        for (let i = HAS_HEADER ? 1 : 0; i < rows.length; i++) {
            const row = rows[i];
            const name = row[0];
            const address = row[1];
            const coords = yield getCoords(address);
            if (!coords) {
                printLog(`Nepodařilo se získat souřadnice pro: ${name}, ${address}`, true);
                continue;
            }
            const wpt = createWpt(coords, name, address);
            console.log(wpt);
            gpxBody.appendChild(wpt);
            printLog(`Převedeno: ${name}, ${address}`);
        }
        resultGPX = new XMLSerializer().serializeToString(gpx);
        downloadBtn.classList.remove('hidden');
    });
}
fileSelect === null || fileSelect === void 0 ? void 0 : fileSelect.addEventListener('change', (e) => __awaiter(void 0, void 0, void 0, function* () {
    resultGPX = '';
    downloadBtn.classList.add('hidden');
    const select = e.target;
    if (!select)
        return;
    const files = select.files;
    if (!files || files.length === 0)
        return;
    const file = files[0];
    if (file) {
        const data = yield new Promise((res, _) => {
            const reader = new FileReader();
            reader.addEventListener('loadend', () => { var _a; return res((_a = reader.result) === null || _a === void 0 ? void 0 : _a.toString()); });
            reader.readAsText(file);
        });
        if (!data)
            return;
        try {
            const parsed = Papa.parse(data);
            const rows = parsed.data;
            yield handleRows(rows);
        }
        catch (e) {
            alert(e);
        }
    }
}));
function download(filename, data) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
downloadBtn.addEventListener('click', () => {
    if (resultGPX.length === 0)
        return;
    const now = new Date();
    download(`converted_${now.toLocaleDateString().replace('/', '-')}.gpx`, resultGPX);
});
