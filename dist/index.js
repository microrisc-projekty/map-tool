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
const fileSelect = document.querySelector('#fileinput');
fileSelect === null || fileSelect === void 0 ? void 0 : fileSelect.addEventListener('change', (e) => __awaiter(void 0, void 0, void 0, function* () {
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
        const parsed = Papa.parse(data);
        console.log(parsed);
    }
}));
