
const fileSelect = document.querySelector('#fileinput');

fileSelect?.addEventListener('change', async (e) => {
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
    if(!data) return;

    const parsed = Papa.parse(data);
		console.log(parsed);
	}
});
