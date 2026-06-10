// 【重要】GitHub公開時はダミーURLに設定。実際の運用時はご自身のスプレッドシートURLに差し替えてください。
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('授業料計算アプリ')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
}

function getSpreadsheet() {
  try {
    const match = SHEET_URL.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) throw new Error("URLの形式が正しくありません。");
    return SpreadsheetApp.openById(match[1]);
  } catch (e) {
    throw new Error("スプレッドシートに接続できません。");
  }
}

function loadData() {
  try {
    let ss = getSpreadsheet();
    let res = {};
    const sheetNames = ['courses', 'items', 'options', 'classes', 'teachers', 'discounts'];
    
    sheetNames.forEach(name => {
      let sheet = ss.getSheetByName(name);
      if (!sheet) { sheet = ss.insertSheet(name); res[name] = []; return; }
      let data = sheet.getDataRange().getValues();
      if (data.length > 1) {
        let headers = data.shift();
        res[name] = data.map(row => {
          let obj = {};
          headers.forEach((h, i) => {
            if (h === 'options') { try { obj[h] = JSON.parse(row[i] || '[]'); } catch(e) { obj[h] = []; } } 
            else { obj[h] = row[i]; }
          });
          return obj;
        });
      } else { res[name] = []; }
    });
    
    let hSheet = ss.getSheetByName('histories') || ss.insertSheet('histories');
    let hData = hSheet.getDataRange().getValues();
    res.histories = (hData.length > 1) ? hData.slice(1).map(row => ({date:row[0], customer:row[1], class:row[2], teacher:row[3], total:row[4]})).reverse().slice(0, 30) : [];
    
    return res;
  } catch (e) { throw new Error(e.message); }
}

function saveMasterData(type, array) {
  let ss = getSpreadsheet();
  let sheet = ss.getSheetByName(type) || ss.insertSheet(type);
  sheet.clear();
  if (!array || array.length === 0) return;
  let headers = Object.keys(array[0]);
  let rows = [headers];
  array.forEach(obj => rows.push(headers.map(h => (typeof obj[h] === 'object') ? JSON.stringify(obj[h]) : obj[h])));
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

function saveAllMasters(dataObj) {
  for (let key in dataObj) { if (dataObj[key] && key !== 'histories') saveMasterData(key, dataObj[key]); }
}

function appendHistory(historyObj) {
  let ss = getSpreadsheet();
  let sheet = ss.getSheetByName('histories') || ss.insertSheet('histories');
  if (sheet.getLastRow() === 0) sheet.appendRow(['date', 'customer', 'class', 'teacher', 'total', 'details']);
  sheet.appendRow([historyObj.date, historyObj.customer, historyObj.class || '', historyObj.teacher || '', historyObj.total, JSON.stringify(historyObj.details)]);
}



















