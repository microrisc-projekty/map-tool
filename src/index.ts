async function validateAPIKey(apiKey: string) {
	return new Promise((res, _) =>
		fetch(`https://api.mapy.cz/v1/timezone/list-timezones?apikey=${apiKey}`)
			.then((d) => d.json())
			.then((d) => res(!!d?.['timezones']))
	);
}

let apiKey: string | null = null;
(async () => {
	while (true) {
		apiKey = prompt('Zadejte API klíč od Mapy.cz');

		if (
			apiKey == null ||
			apiKey.length === 0 ||
			!(await validateAPIKey(apiKey))
		)
			continue;
		break;
	}
	document.querySelector('#root')?.classList.remove('hidden');
})();

const fileSelect = document.querySelector('#fileinput');
const log = document.querySelector('#log');
const downloadBtn = document.querySelector('#download')!;

function printLog(message: string, isError: boolean = false) {
	if (!log) return;
	const paragraph = document.createElement('p');
	if (isError) paragraph.style.color = 'red';
	paragraph.innerText = message;
	log.appendChild(paragraph);
}

const HAS_HEADER = true;
// const API_KEY = '<klic>';
const API_PATH = 'https://api.mapy.cz/v1/geocode';
interface Coords {
	lat: number;
	lon: number;
}
function getCoords(address: string): Promise<Coords | null> {
	return new Promise((res, rej) => {
		fetch(API_PATH + `?apikey=${apiKey}&query="${address}"&lang=cs&limit=1`)
			.then((d) => d.json())
			.then((d) => {
				res(d?.['items']?.[0]?.['position'] || null);
			});
	});
}
const createWpt = (coords: Coords, name: string, description: string) => {
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

async function handleRows(rows: string[][]) {
	if (rows.length === 0) return;
	const gpx = createGPX();
	const gpxBody = gpx.querySelector('gpx')!;

	for (let i = HAS_HEADER ? 1 : 0; i < rows.length; i++) {
		const row = rows[i];
		const name = row[0];

		const address = row.slice(1).join(",");
		const coords = await getCoords(address);
		if (!coords) {
			printLog(
				`Nepodařilo se získat souřadnice pro: ${name}, ${address}`,
				true
			);
			continue;
		}
		const wpt = createWpt(coords, name, address);
		console.log(wpt);
		gpxBody.appendChild(wpt);
		printLog(`Převedeno: ${name}, ${address}`);
	}

	resultGPX = new XMLSerializer().serializeToString(gpx);
	downloadBtn.classList.remove('hidden');
}
fileSelect?.addEventListener('change', async (e) => {
	resultGPX = '';
	downloadBtn.classList.add('hidden');

	const select = e.target as HTMLInputElement;
	if (!select) return;
	const files = select.files;
	if (!files || files.length === 0) return;
	const file = files[0];
	if (file) {
		const data: string | undefined = await new Promise((res, _) => {
			const reader = new FileReader();
			reader.addEventListener('loadend', () => res(reader.result?.toString()));
			reader.readAsText(file);
		});
		if (!data) return;

		try {
			const parsed = Papa.parse(data, { delimiter: ';' });
			const rows = parsed.data as string[][];
			await handleRows(rows);
		} catch (e) {
			alert(e);
		}
	}
});

function download(filename: string, data: string) {
	const element = document.createElement('a');
	element.setAttribute(
		'href',
		'data:text/plain;charset=utf-8,' + encodeURIComponent(data)
	);
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

downloadBtn.addEventListener('click', () => {
	if (resultGPX.length === 0) return;
	const now = new Date();
	download(
		`converted_${now.toLocaleDateString().replace('/', '-')}.gpx`,
		resultGPX
	);
});
