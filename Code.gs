/**
 * =======================================================================
 * Fichier : Code.gs
 * Description : Backend - Dashboard Pilotage Région Centre
 * Entités : CSS (Safi), CIOB (Benguerir), CIMO (Essaouira), 
 *           HIIN (Marrakech), HPB (Beni Mellal)
 * =======================================================================
 */

// =======================================================================
// CONFIGURATION
// =======================================================================

const MAIN_SPREADSHEET_ID = "1qGTfY5moFGk0h3gzofJZ8okz03RDfMCcgcWHz3TNwyM";
const SPREADSHEET_ID_2026 = "1PjRrUHvC7daE9McMczrMnkEy_iEcqO3UCCPfgPgGdRo"; // Nouveau fichier 2026
const REC_EXP_SOURCE_ID = "1o7POmu556ISmLvDgooBbfdXCxDjod1NYKT6BfR8hxMc";
const RH_SPREADSHEET_ID = "16PgnPwy3KBH-Iwylos7v-xFECINk3z0sCWNwQ1hvg60";

const ENTITES_REGION = ["CSS", "CIOB", "CIMO", "HIIN", "HPB"];

// =======================================================================
// 1. CONFIGURATION ET MENU
// =======================================================================

function doGet() {
  var template = HtmlService.createTemplateFromFile('Index');
  
  template.userEmail = Session.getActiveUser().getEmail();
  template.userName = template.userEmail.split('@')[0].replace('.', ' ');
  template.userPoste = "Chargé reporting régional";
  template.userPhoto = "https://ui-avatars.com/api/?name=" + template.userName + "&background=e0e7ff&color=005c97&bold=true";
  
  const props = PropertiesService.getScriptProperties();
  template.appVersion = props.getProperty('APP_VERSION') || "v1.0.0";
  
  return template.evaluate()
      .setTitle('DASHBOARD - REGION CENTRE')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('⚙️ Administration')
    .addItem('🔄 Mettre à jour Flash (BDD)', 'clientNormalizeData')
    .addItem('📥 Import Détail Organismes', 'importDetailsOrganisme')
    .addSeparator()
    .addItem('🚀 Incrémenter la version Dashboard', 'incrementAppVersion')
    .addToUi();
}

// =======================================================================
// 2. MODULE DASHBOARD (FLASH & BUDGET)
// =======================================================================

function getDashboardData() {
  const rawData = { 
    normalizedData: getNormalizedData(),
    contactData: getExtraData().contact,
    caData: getExtraData().ca,
    capacity: getExtraData().capacity
  };

  return { 
    ...rawData, 
    userContext: { 
      email: Session.getActiveUser().getEmail(), 
      hasAccess: true, 
      role: 'ADMIN', 
      entity: 'ALL',
      poste: 'Contrôleur de Gestion',
      photo: ''
    } 
  };
}

function normalizeData() {
  var allData = [];
  var headers = ["Entité","Mois","Famille","Sous-famille","Élément","Valeur", "Année"];
  allData.push(headers);
  
  // 1. Lecture de la base 2025 (Fichier Principal)
  try {
    var ss2025 = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    // Traitement BDD 2025
    var data2025 = processSheetData(ss2025, 'BDD', null);
    if (data2025.length > 0) allData = allData.concat(data2025);
  } catch(e) {
    Logger.log("Erreur normalizeData 2025: " + e.message);
  }

  // 2. Lecture de la NOUVELLE base 2026 (Nouveau Fichier)
  try {
    var ss2026 = SpreadsheetApp.openById(SPREADSHEET_ID_2026);
    
    // IMPORTANT : Si dans votre nouveau fichier 2026, les mois de Janvier à Décembre 
    // sont dans les premières colonnes (D à O) comme pour 2025, on force l'année à 2026.
    // Si vous avez gardé les colonnes de l'année dernière et que 2026 est dans les colonnes P à AA, 
    // vous pouvez remettre "null" à la place de "2026".
    var data2026 = processSheetData(ss2026, 'BDD', 2026); 
    
    if (data2026.length > 0) allData = allData.concat(data2026);
  } catch(e) {
    Logger.log("Erreur normalizeData 2026: " + e.message);
  }
  
  // 3. Sauvegarde dans l'onglet NORMALIZED du Dashboard
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var normSheet = ss.getSheetByName("NORMALIZED");
  if (!normSheet) normSheet = ss.insertSheet("NORMALIZED");
  normSheet.clear();
  
  if (allData.length > 1) {
    normSheet.getRange(1, 1, allData.length, allData[0].length).setValues(allData);
  }
  
  return allData;
}

function normalizeData() {
  var allData = [];
  var headers = ["Entité","Mois","Famille","Sous-famille","Élément","Valeur", "Année"];
  allData.push(headers);
  
  // 1. Lecture de la base 2025 (Fichier Principal)
  try {
    var ss2025 = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    // CORRECTION IMPORTANTE ICI : On force l'année 2025
    var data2025 = processSheetData(ss2025, 'BDD', 2025);
    if (data2025.length > 0) allData = allData.concat(data2025);
  } catch(e) {
    Logger.log("Erreur normalizeData 2025: " + e.message);
  }

  // 2. Lecture de la NOUVELLE base 2026 (Nouveau Fichier)
  try {
    var ss2026 = SpreadsheetApp.openById(SPREADSHEET_ID_2026);
    // On force l'année 2026
    var data2026 = processSheetData(ss2026, 'BDD', 2026); 
    if (data2026.length > 0) allData = allData.concat(data2026);
  } catch(e) {
    Logger.log("Erreur normalizeData 2026: " + e.message);
  }
  
  // 3. Sauvegarde dans l'onglet NORMALIZED du Dashboard
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var normSheet = ss.getSheetByName("NORMALIZED");
  if (!normSheet) normSheet = ss.insertSheet("NORMALIZED");
  normSheet.clear();
  
  if (allData.length > 1) {
    normSheet.getRange(1, 1, allData.length, allData[0].length).setValues(allData);
  }
  
  return allData;
}

function processSheetData(ss, sheetName, forcedYear) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if(data.length < 4) return [];
  
  var normalized = [];
  var moisNoms = ["JAN", "FEV", "MAR", "AVR", "MAI", "JUIN", "JUIL", "AOU", "SEP", "OCT", "NOV", "DEC"];
  var lastEntite = "";
  
  // DÉFINITION EXACTE DES COLONNES
  var colFamille = 29;     // Par défaut (AD) pour 2025
  var colSousFamille = 30; // Par défaut (AE) pour 2025
  
  // SI ON LIT LE FICHIER 2026, ON CIBLE R (17) et S (18)
  if (forcedYear === 2026) {
      colFamille = 17;     // Colonne R
      colSousFamille = 18; // Colonne S
  }
  
  for (var i = 3; i < data.length; i++) {
    var entite = data[i][0];
    if (entite && String(entite).trim() !== '') { lastEntite = entite; } else { entite = lastEntite; }
    
    var element = data[i][2]; 
    var famille = data[i][colFamille]; 
    var sousFamille = data[i][colSousFamille];
    
    if (!entite || !element || String(element).trim() === '') continue;
    
    // --- LECTURE STRICTE DES COLONNES D(3) à O(14) ---
    for (var j = 3; j <= 14; j++) {
      if (j >= data[0].length) break;
      
      var headerVal = data[0][j];
      var moisFormatte = moisNoms[j - 3]; // Exemple: j=3 -> index 0 -> JAN
      
      if (headerVal instanceof Date) { 
        moisFormatte = moisNoms[headerVal.getMonth()];
      } else if (headerVal) {
        var s = String(headerVal).toUpperCase().trim();
        if (s.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}/)) { 
          var parts = s.split(/[\/\-\.]/);
          var mIdx = parseInt(parts[1], 10) - 1; 
          if (mIdx >= 0 && mIdx < 12) moisFormatte = moisNoms[mIdx];
        } else { 
          if (s.startsWith("JUIN")) moisFormatte = "JUIN";
          else if (s.startsWith("JUIL")) moisFormatte = "JUIL"; 
          else if (moisNoms.includes(s.substring(0, 3))) moisFormatte = s.substring(0, 3); 
        }
      }
      
      var val = data[i][j];
      if (val === "" || val == null) val = 0;
      
      // On injecte avec la bonne année
      normalized.push([entite, moisFormatte, famille, sousFamille, element, val, forcedYear]);
    }
  }
  
  return normalized;
}

function getExtraData() {
  // Ouverture des deux fichiers
  var ss2025 = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
  var ss2026 = SpreadsheetApp.openById(SPREADSHEET_ID_2026); 
  
  var extraData = { contact: {}, ca: {}, capacity: {} };
  var moisNoms = ["JAN", "FEV", "MAR", "AVR", "MAI", "JUIN", "JUIL", "AOU", "SEP", "OCT", "NOV", "DEC"];

  // Récupération des contacts (depuis le fichier 2026 par défaut pour être à jour)
  try {
    var lienFlash = ss2026.getSheetByName("LIEN FLASH"); 
    if (lienFlash && lienFlash.getLastRow() > 1) {
      lienFlash.getDataRange().getValues().slice(1).forEach(function(row) { 
        if (row[0]) extraData.contact[row[0]] = { respExploit: row[18] || '-', dirMedical: row[22] || '-' };
      });
    }
  } catch(e) {}
  
  // Fonction de traitement interne (CA et Capacité)
  var processExtraSheets = function(sourceSS, sheetNameCA, sheetNameCap, year) {
    var sheetCA = sourceSS.getSheetByName(sheetNameCA);
    if (sheetCA && sheetCA.getLastRow() > 1) {
      var dataCA = sheetCA.getDataRange().getValues();
      dataCA.slice(1).forEach(function(row) { 
        var ent = row[16]; 
        if (ent) {
          var mCA = {}; 
          for (var k = 0; k < 12; k++) mCA[moisNoms[k]] = parseMoney(row[17 + k]); 
          if (!extraData.ca[ent]) extraData.ca[ent] = {};
          extraData.ca[ent][year] = { caMensuel: mCA, caAnnuel: row[29] || 0, budgetAnnuel: parseMoney(row[30]) };
        }
      });
    }
    var sheetCap = sourceSS.getSheetByName(sheetNameCap);
    if (sheetCap && sheetCap.getLastRow() > 2) {
      var dataCap = sheetCap.getDataRange().getValues();
      dataCap.slice(2).forEach(function(row) {
        if (row[0] && row[3]) {
          var key = String(row[0]).trim() + "_" + String(row[3]).trim();
          var c = {}; 
          for (var m = 0; m < 12; m++) c[moisNoms[m]] = row[4 + m] || 0;
          if (!extraData.capacity[key]) extraData.capacity[key] = {};
          extraData.capacity[key][year] = c;
        }
      });
    }
  };
  
  // L'ASTUCE EST ICI : On passe le fichier ss2025 pour 2025, et ss2026 pour 2026
  processExtraSheets(ss2025, "RECAP", "CAPACITE", 2025);
  processExtraSheets(ss2026, "RECAP", "CAPACITE", 2026);
  
  return extraData;
}

function parseMoney(v) { 
  return typeof v === 'number' ? v : parseFloat(String(v).replace(/[€,\s\u00A0]/g, '').replace(',','.')) || 0; 
}

function getNormalizedData() { 
  const ss = SpreadsheetApp.getActiveSpreadsheet(); 
  const sheet = ss.getSheetByName("NORMALIZED"); 
  if (!sheet) return normalizeData(); 
  return sheet.getDataRange().getValues(); 
}

function clientNormalizeData() { 
  try { 
    normalizeData(); 
    return "Mise à jour Flash réussie !"; 
  } catch (e) { 
    return "Erreur : " + e.message; 
  } 
}

// =======================================================================
// 3. MODULE DÉPENSES CAISSES
// =======================================================================

function saveExpensesData(cleanData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("DEPENSES");
  const headers = ["Entité", "Jour", "Mois", "Année", "Bénéficiaire", "Montant (MAD)", "Nature", "Catégorie", "Ordre"];
  
  if (!sheet) {
    sheet = ss.insertSheet("DEPENSES");
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  } else {
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (currentHeaders.length < 9 || currentHeaders[1] !== "Jour") {
      sheet.clear();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  }
  
  if (!cleanData || cleanData.length === 0) return "Aucune donnée.";
  
  const entityToReplace = String(cleanData[0][0]).trim();
  const lastRow = sheet.getLastRow();
  let existingData = [];
  if (lastRow > 1) {
    existingData = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  }
  
  const keptData = existingData.filter(row => String(row[0]).trim() !== entityToReplace);
  const finalData = [...keptData, ...cleanData];
  
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  if (finalData.length > 0) {
    sheet.getRange(2, 1, finalData.length, finalData[0].length).setValues(finalData);
  }
  
  const today = new Date();
  const dateStr = today.getDate().toString().padStart(2, '0') + '/' + (today.getMonth() + 1).toString().padStart(2, '0') + '/' + today.getFullYear();
  PropertiesService.getScriptProperties().setProperty('LAST_DEPENSE_UPDATE', dateStr);
  
  return "Succès : Dépenses mises à jour pour " + entityToReplace;
}

function getExpensesDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("DEPENSES");
  const lastUpdate = PropertiesService.getScriptProperties().getProperty('LAST_DEPENSE_UPDATE') || "--/--/----";
  
  if (!sheet) return { data: [], lastUpdate: lastUpdate }; 
  
  const rawData = sheet.getDataRange().getValues();
  return { data: rawData, lastUpdate: lastUpdate };
}

// =======================================================================
// 4. MODULE RECOUVREMENT
// =======================================================================

function getDelaisData() {
  try {
    const ss = SpreadsheetApp.openById(REC_EXP_SOURCE_ID);
    const sheet = ss.getSheetByName("Délais Obj Rec");
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    return data.slice(1);
  } catch (e) {
    Logger.log("Erreur lecture délais : " + e.message);
    return [];
  }
}

function saveRecouvFocusData(cleanData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("RECOUV_FOCUS");
  const headers = [
    "Entité", "Famille", "Num. Dossier", "Patient", "N° Facture", 
    "J_Recep", "M_Recep", "A_Recep", "Expédié Par", 
    "J_Exp", "M_Exp", "A_Exp", "J_Ret", "M_Ret", "A_Ret", 
    "Motif Retour", "Organisme", "Matricule", "Montant"
  ];
  if (!sheet) {
    sheet = ss.insertSheet("RECOUV_FOCUS");
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  
  if (!cleanData || cleanData.length === 0) return "Aucune donnée reçue.";
  const entitiesToReplace = [...new Set(cleanData.map(r => String(r[0]).trim()))];
  const lastRow = sheet.getLastRow();
  
  let existingData = [];
  if (lastRow > 1) {
    const lastCol = sheet.getLastColumn();
    const rawData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    existingData = rawData.map(row => {
      if (row.length > 19) return row.slice(0, 19);
      if (row.length < 19) {
        let newRow = [...row];
        while (newRow.length < 19) newRow.push("");
        return newRow;
      }
      return row;
    });
  }
  
  const keptData = existingData.filter(row => {
    const rowEnt = String(row[0]).trim();
    return !entitiesToReplace.includes(rowEnt);
  });
  const finalData = [...keptData, ...cleanData];
  
  sheet.clearContents(); 
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  if (finalData.length > 0) {
    sheet.getRange(2, 1, finalData.length, 19).setValues(finalData);
  }
  
  const today = new Date();
  const dateStr = today.getDate().toString().padStart(2, '0') + '/' + (today.getMonth() + 1).toString().padStart(2, '0') + '/' + today.getFullYear() + ' à ' + today.getHours().toString().padStart(2, '0') + ':' + today.getMinutes().toString().padStart(2, '0');
  PropertiesService.getScriptProperties().setProperty('LAST_RECOUV_UPDATE', dateStr);

  return "Succès Recouvrement. Mises à jour : " + entitiesToReplace.join(', ');
}

function getRecouvFocusData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let lastUpdate = "--/--/----";
  try {
    const prop = PropertiesService.getScriptProperties().getProperty('LAST_RECOUV_UPDATE');
    if (prop) lastUpdate = prop;
  } catch(e) {}

  try {
    const sheet = ss.getSheetByName("RECOUV_FOCUS");
    if (!sheet || sheet.getLastRow() < 2) return { data: [], lastUpdate: lastUpdate };
    const rawData = sheet.getDataRange().getValues();
    return { data: rawData, lastUpdate: lastUpdate };
  } catch (e) {
    return { data: [], lastUpdate: lastUpdate };
  }
}

// =======================================================================
// 5. MODULE EXPEDITION
// =======================================================================

function saveExpeditionData(cleanData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("EXPEDITION_FOCUS");
  const headers = [
    "Entité", "Num. Dossier", "Patient", "Motif", 
    "J_Sortie", "M_Sortie", "A_Sortie", 
    "Organisme", "N° Facture", "Nature",
    "J_PEC", "M_PEC", "A_PEC", 
    "Montant PEC",
    "J_Entree", "M_Entree", "A_Entree",
    "Responsable PEC"
  ];
  if (!sheet) {
    sheet = ss.insertSheet("EXPEDITION_FOCUS");
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  
  if (!cleanData || cleanData.length === 0) return "Aucune donnée.";
  
  const entitiesToReplace = [...new Set(cleanData.map(r => String(r[0]).trim()))];
  const lastRow = sheet.getLastRow();
  
  let existingData = [];
  if (lastRow > 1) {
    const lastCol = sheet.getLastColumn();
    const readWidth = lastCol < headers.length ? headers.length : lastCol;
    if (readWidth > 0) {
      const rawData = sheet.getRange(2, 1, lastRow - 1, readWidth).getValues();
      existingData = rawData.map(row => {
        let newRow = row.slice(0, headers.length);
        while(newRow.length < headers.length) newRow.push("");
        return newRow;
      });
    }
  }
  
  const keptData = existingData.filter(row => !entitiesToReplace.includes(String(row[0]).trim()));
  const finalData = [...keptData, ...cleanData];
  
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  
  if (finalData.length > 0) {
    sheet.getRange(2, 1, finalData.length, headers.length).setValues(finalData);
  }
  
  const today = new Date();
  PropertiesService.getScriptProperties().setProperty('LAST_EXPEDITION_UPDATE', today.toLocaleString());
  
  return "Succès Expédition. " + finalData.length + " dossiers traités.";
}

function getExpeditionData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let lastUpdate = "--/--/----";
  try { 
    lastUpdate = PropertiesService.getScriptProperties().getProperty('LAST_EXPEDITION_UPDATE') || lastUpdate;
  } catch(e) {}

  const sheet = ss.getSheetByName("EXPEDITION_FOCUS");
  if (!sheet || sheet.getLastRow() < 2) return { data: [], lastUpdate: lastUpdate };
  
  const rawData = sheet.getDataRange().getValues();
  return { data: rawData, lastUpdate: lastUpdate };
}

// =======================================================================
// 6. MODULE SUIVI DES RETOURS
// =======================================================================

function getSuiviRetoursData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Configuration des colonnes par entité
  // ⚠️ ADAPTEZ ces colonnes selon vos fichiers de retours Region Centre
  const COL_CONFIG = {
    "HIIN":  { patient: "B", reponse: "C", facture: "D", organisme: "G", montant: "J", observation: "K", motif: "L" },
    "CSS":   { patient: "B", reponse: "C", facture: "D", organisme: "G", montant: "J", observation: "K", motif: "L" },
    "CIOB":  { patient: "B", reponse: "C", facture: "D", organisme: "G", montant: "J", observation: "K", motif: "L" },
    "CIMO":  { patient: "B", reponse: "C", facture: "D", organisme: "G", montant: "J", observation: "K", motif: "L" },
    "HPB":   { patient: "B", reponse: "C", facture: "D", organisme: "G", montant: "J", observation: "K", motif: "L" }
  };
  
  // ⚠️ REMPLACEZ les IDs par les vrais IDs de vos fichiers de retours
  const sources = [
    { entite: "HIIN",  id: "VOTRE_ID_RETOURS_HIIN", sheetName: "HIIN" },
    { entite: "CSS",   id: "VOTRE_ID_RETOURS_CSS", sheetName: "CSS" },
    { entite: "CIOB",  id: "VOTRE_ID_RETOURS_CIOB", sheetName: "CIOB" },
    { entite: "CIMO",  id: "VOTRE_ID_RETOURS_CIMO", sheetName: "CIMO" },
    { entite: "HPB",   id: "VOTRE_ID_RETOURS_HPB", sheetName: "HPB" }
  ];
  
  let compiledData = [];

  sources.forEach(source => {
    try {
      const extSs = SpreadsheetApp.openById(source.id);
      const sheet = extSs.getSheetByName(source.sheetName);
      
      if (sheet) {
        const lastRow = sheet.getLastRow();
        if (lastRow >= 5) { 
          const conf = COL_CONFIG[source.entite];
          if (conf) {
            const dataValues = sheet.getRange(5, 1, lastRow - 4, sheet.getLastColumn()).getValues();
            
            const idxPatient = letterToColumn(conf.patient) - 1;
            const idxReponse = letterToColumn(conf.reponse) - 1;
            const idxFacture = letterToColumn(conf.facture) - 1;
            const idxOrganisme = letterToColumn(conf.organisme) - 1;
            const idxMontant = letterToColumn(conf.montant) - 1;
            const idxObs = letterToColumn(conf.observation) - 1;
            const idxMotif = letterToColumn(conf.motif) - 1;

            dataValues.forEach(row => {
              const valPatient = row[idxPatient];
              const valFacture = row[idxFacture];

              if ((valPatient && String(valPatient).trim() !== "") || (valFacture && String(valFacture).trim() !== "")) {
                const motifOriginal = String(row[idxMotif] || "").trim();
                compiledData.push({
                  entite: source.entite,
                  patient: String(valPatient || "").trim(),
                  reponse: String(row[idxReponse] || "").trim(),
                  facture: String(valFacture || "").trim(),
                  organisme: String(row[idxOrganisme] || "").trim(),
                  montant: cleanImportAmount(row[idxMontant]),
                  observation: String(row[idxObs] || "").trim(),
                  motif: motifOriginal,
                  motifStd: standardizeMotif(motifOriginal)
                });
              }
            });
          }
        }
      }
    } catch (e) {
      Logger.log("Erreur import " + source.entite + " : " + e.message);
    }
  });

  return compiledData;
}

function letterToColumn(letter) {
  let column = 0, length = letter.length;
  for (let i = 0; i < length; i++) {
    column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
  }
  return column;
}

function cleanImportAmount(val) {
  if (val == null || val === "") return 0;
  if (typeof val === 'number') return val;
  let s = String(val).replace(/[^0-9.,-]/g, '');
  s = s.replace(',', '.');
  const parsed = parseFloat(s);
  return isNaN(parsed) ? 0 : parsed;
}

function standardizeMotif(rawVal) {
  if (!rawVal) return "";
  const s = String(rawVal).trim();
  const upper = s.toUpperCase();

  const RULES = [
    { label: "Surfacturation", keywords: ["SURFACTURATION", "SUFACTURATION"] },
    { label: "Non Conforme PEC", keywords: ["NON CONFORME A LA PEC", "NON CONFORME A L'ACCORD", "NON CONFORME A LA PRISE EN CHARGE", "ACTE NON COUVERT", "CODE DE L'ACTE", "PAS FAIT OBJET D UN ACCORD", "PAS CONFORME A LA PEC"] },
    { label: "Hors Délai / Validité", keywords: ["HORS DELAIS", "HORS DÉLAIS", "VALIDITE", "DATE DU DECES", "DATE DE COUVERTURE", "POSTERIEURS A LA DATE", "DELA DE LA DATE", "PRESCRIPTION EST ERRONEE"] },
    { label: "Problème Facture / ICE", keywords: ["FACTURE ERRONEE", "FACTURE ERRONÉE", "MANQUE FACTURE", "ORIGINAL DE LA FACTURE", "NOM JURIDIQUE", "ICE", "IDENTIFICATION FISCAL", "TICKET MODERATEUR", "PART CNOPS"] },
    { label: "Prescription Manquante", keywords: ["MANQUE PRESCRIPTION", "MQ PRESCRIPTION", "MANQUE ORDONNANCE", "MQ ORDONNANCE", "ABSENCE DE LA PRESCRIPTION"] },
    { label: "Détail Médicaments / Vignette", keywords: ["DETAIL DES MEDICAMENTS", "DETAIL MEDICAMENTS", "DECOMPTE PHARMACIE", "DECOMPTE DES MEDICAMENTS", "VIGNETTE", "CODE A BARRE", "PHARMACIE"] },
    { label: "Compte Rendu Manquant", keywords: ["COMPTE RENDU", "CR OPERATOIRE", "CR HOSPITALISATION", "CR ANAPATH", "CR RADIO", "RAPPORT"] },
    { label: "CD / Imagerie", keywords: ["CD DE LA", "CLICHE", "ECHO"] },
    { label: "Signature / Cachet / INPE", keywords: ["SIGNATURE", "CACHET", "INPE", "IDENTIFICATION DU MEDECIN", "IDENTIFICATION DU MEDCIN"] },
    { label: "CIN / Identité", keywords: ["CIN", "CARTE NATIONALE", "CARTE D'IDENTITE", "NOM DU BENEFICIAIRE", "NOM ADHERENT", "LIEN AVEC L'ASSURE", "ASSUREE ERRONE", "ADHERENT SUR FACTURE"] },
    { label: "Accident / PV", keywords: ["ACCIDENT", "PROCES VERBAL", "PV"] },
    { label: "Droits Fermés / Annulé", keywords: ["FERMETURE DROIT", "DROIT FERME", "ANNULEE", "ANNULÉE"] },
    { label: "DMI / Prothèse", keywords: ["DISPOSITIF MEDICAL", "PROTHESE", "STENT", "DMI"] },
    { label: "Problème Date (Divers)", keywords: ["DATE", "DISCORDANCE", "RECTIFICATION DATE"] }
  ];
  for (let i = 0; i < RULES.length; i++) {
    if (RULES[i].keywords.some(k => upper.includes(k))) {
      return RULES[i].label;
    }
  }
  return "Autre";
}

// =======================================================================
// 7. MODULE OBJECTIF VS RÉALISATION
// =======================================================================

function importObjRealData() {
  const SHEET_NAME = 'RECOUVREMENT & EXPEDITION';
  const TARGET_SHEET_NAME = 'OBJ_REAL_DATA';
  try {
    const sourceSS = SpreadsheetApp.openById(REC_EXP_SOURCE_ID);
    const sourceSheet = sourceSS.getSheetByName(SHEET_NAME);
    if (!sourceSheet) return "Erreur : La feuille 'RECOUVREMENT & EXPEDITION' est introuvable.";
    const data = sourceSheet.getDataRange().getValues();
    if (data.length < 2) return "Aucune donnée à importer.";
    
    const processedData = [];
    processedData.push(["Famille", "Jour", "Mois", "Année", "Entité", "Objectif", "Réalisation"]); 

    const moisNoms = ["JAN", "FEV", "MAR", "AVR", "MAI", "JUIN", "JUIL", "AOU", "SEP", "OCT", "NOV", "DEC"];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const famille = row[1]; 
      const dateRaw = row[2];
      const entite = row[4];
      const obj = row[5];
      const real = row[6];

      if (!famille && !entite) continue;
      let j = "", m = "", a = "";
      if (dateRaw instanceof Date) {
        j = dateRaw.getDate();
        m = moisNoms[dateRaw.getMonth()];
        a = dateRaw.getFullYear();
      } else if (String(dateRaw).trim() !== "") {
        try {
          const parts = String(dateRaw).split('/');
          if(parts.length === 3) {
            j = parseInt(parts[0], 10);
            let mIdx = parseInt(parts[1], 10) - 1;
            m = moisNoms[mIdx] || parts[1];
            a = parseInt(parts[2], 10);
          }
        } catch(e) {}
      }
      processedData.push([famille, j, m, a, entite, obj, real]);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let targetSheet = ss.getSheetByName(TARGET_SHEET_NAME);
    if (!targetSheet) {
      targetSheet = ss.insertSheet(TARGET_SHEET_NAME);
    } else {
      targetSheet.clear();
    }
    
    if (processedData.length > 0) {
      targetSheet.getRange(1, 1, processedData.length, processedData[0].length).setValues(processedData);
    }

    return "Succès : " + (processedData.length - 1) + " lignes importées.";
  } catch (e) {
    return "Erreur lors de l'importation : " + e.message;
  }
}

function getObjRealDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("OBJ_REAL_DATA");
  if (!sheet) return [];
  return sheet.getDataRange().getValues();
}

// =======================================================================
// 8. MODULE HONORAIRES MEDECINS
// =======================================================================

function clearHonorairesFile(entity, year) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let indexSheet = ss.getSheetByName("DB_INDEX");
  if (!indexSheet) return "Index introuvable";

  const indexData = indexSheet.getDataRange().getValues();
  let targetId = null;
  for (let i = 1; i < indexData.length; i++) {
    if (String(indexData[i][0]) === String(entity) && String(indexData[i][1]) === String(year)) {
      targetId = indexData[i][2];
      break;
    }
  }

  if (targetId) {
    try {
      const targetSS = SpreadsheetApp.openById(targetId);
      const targetSheet = targetSS.getSheets()[0];
      if (targetSheet.getLastRow() > 1) {
        targetSheet.getRange(2, 1, targetSheet.getLastRow() - 1, targetSheet.getLastColumn()).clearContent();
      }
      return "CLEARED";
    } catch (e) {
      return "Erreur clear: " + e.message;
    }
  }
  return "NOT_FOUND";
}

function saveHonorairesBatch(data, entity, year) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let indexSheet = ss.getSheetByName("DB_INDEX");
  if (!indexSheet) {
    indexSheet = ss.insertSheet("DB_INDEX");
    indexSheet.appendRow(["ENTITE", "ANNEE", "SPREADSHEET_ID", "FILENAME", "LAST_UPDATE"]);
    indexSheet.getRange(1,1,1,5).setFontWeight("bold");
  }

  const indexData = indexSheet.getDataRange().getValues();
  let targetId = null;
  let rowIndex = -1;

  for (let i = 1; i < indexData.length; i++) {
    if (String(indexData[i][0]) === String(entity) && String(indexData[i][1]) === String(year)) {
      targetId = indexData[i][2];
      rowIndex = i + 1;
      break;
    }
  }

  let targetSS;
  if (targetId) {
    try {
      targetSS = SpreadsheetApp.openById(targetId);
    } catch(e) {
      return "Erreur : Impossible d'ouvrir le fichier d'archive pour " + entity + " " + year;
    }
  } else {
    const fileName = "DB_HONO_" + entity + "_" + year;
    targetSS = SpreadsheetApp.create(fileName);
    const headers = [
      "Entité", "J_Sortie", "M_Sortie", "A_Sortie", "Famille", "Bénéficiaire", "Spécialité", "Solde",
      "Type Paie", "Organisme", "Num PEC", "Dossier", "Réglé", "J_Paie", "M_Paie", "A_Paie",
      "Type Paiement", "Montant Brut", "Montant Net", "Montant Retenu", "Patente", "J_Envoi", "M_Envoi", "A_Envoi",
      "Type Organisme", "Eligible", "Mode Paie"
    ];
    targetSS.getSheets()[0].setName("DATA");
    targetSS.getSheets()[0].appendRow(headers);
    indexSheet.appendRow([entity, year, targetSS.getId(), fileName, new Date()]);
  }

  const targetSheet = targetSS.getSheets()[0];
  if (data.length > 0) {
    targetSheet.getRange(targetSheet.getLastRow() + 1, 1, data.length, data[0].length).setValues(data);
  }

  if(rowIndex > -1) {
    indexSheet.getRange(rowIndex, 5).setValue(new Date());
  }

  return "OK";
}

// Remplacez votre fonction onOpen existante par celle-ci pour ajouter le bouton
function onOpen() {
  SpreadsheetApp.getUi().createMenu('⚙️ Administration')
    .addItem('🔄 Mettre à jour Flash (BDD)', 'clientNormalizeData')
    .addItem('📥 Import Détail Organismes', 'importDetailsOrganisme')
    .addItem('⚡ Consolider Honoraires (Rapide)', 'consoliderHonoraires') // <-- NOUVEAU BOUTON
    .addSeparator()
    .addItem('🚀 Incrémenter la version Dashboard', 'incrementAppVersion')
    .addToUi();
}

// =======================================================================
// MODULE HONORAIRES MEDECINS (MODE ULTRA RAPIDE)
// =======================================================================

// 1. Nouvelle fonction qui fusionne tout en arrière-plan
function consoliderHonoraires() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const indexSheet = ss.getSheetByName("DB_INDEX");
  if (!indexSheet || indexSheet.getLastRow() < 2) return "Aucune archive trouvée";

  const sources = indexSheet.getRange(2, 1, indexSheet.getLastRow() - 1, 5).getValues();
  let aggregData = [];
  const dummyHeader = [
    "Entité", "J_Sortie", "M_Sortie", "A_Sortie", "Famille", "Bénéficiaire", "Spécialité", "Solde",
    "Type Paie", "Organisme", "Num PEC", "Dossier", "Réglé", "J_Paie", "M_Paie", "A_Paie",
    "Type Paiement", "Montant Brut", "Montant Net", "Montant Retenu", "Patente", "J_Envoi", "M_Envoi", "A_Envoi",
    "Type Organisme", "Eligible", "Mode Paie"
  ];
  aggregData.push(dummyHeader);

  // Aspire tous les fichiers
  for (let i = 0; i < sources.length; i++) {
    const id = sources[i][2];
    try {
      const extSS = SpreadsheetApp.openById(id);
      const extSheet = extSS.getSheets()[0];
      const lr = extSheet.getLastRow();
      if (lr > 1) {
        const vals = extSheet.getRange(2, 1, lr - 1, 27).getValues();
        aggregData = aggregData.concat(vals);
      }
    } catch (e) {
      console.error("Erreur lecture ID " + id);
    }
  }

  // Stocke dans un onglet unique
  let consolideSheet = ss.getSheetByName("HONO_CONSOLIDE");
  if (!consolideSheet) {
    consolideSheet = ss.insertSheet("HONO_CONSOLIDE");
  }
  consolideSheet.clear();
  
  if (aggregData.length > 1) {
    consolideSheet.getRange(1, 1, aggregData.length, aggregData[0].length).setValues(aggregData);
  }
  
  const now = new Date().toLocaleString('fr-FR');
  PropertiesService.getScriptProperties().setProperty('LAST_HONO_CONSOLIDE', now);
  return "Succès : " + (aggregData.length - 1) + " lignes consolidées.";
}

// 2. On remplace l'ancienne fonction très lente par celle-ci qui lit juste le fichier fusionné
function getHonorairesData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("HONO_CONSOLIDE");
  
  let lastUpdate = "--/--/----";
  try {
    lastUpdate = PropertiesService.getScriptProperties().getProperty('LAST_HONO_CONSOLIDE') || lastUpdate;
  } catch(e) {}

  if (!sheet || sheet.getLastRow() < 2) {
    return { data: [], lastUpdate: "Veuillez lancer la consolidation depuis le menu" };
  }

  const data = sheet.getDataRange().getValues();
  return { data: data, lastUpdate: lastUpdate };
}
// =======================================================================
// 9. MODULE DOSSIERS NON SOLDÉS
// =======================================================================

function saveNonSoldesData(cleanData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("NON_SOLDE_FOCUS");
  
  const headers = [
    "Entité", "Num. Dossier", "ID Séjour", "Patient", "Service", 
    "J_Sortie", "M_Sortie", "A_Sortie", "Organisme", "N° facture", 
    "Total patient", "Total Paiement", "Reste", 
    "Chèques Impayés", "Chèques Caution", "État Dossier", "Note Dossier"
  ];

  if (!sheet) {
    sheet = ss.insertSheet("NON_SOLDE_FOCUS");
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  
  if (!cleanData || cleanData.length === 0) return "Aucune donnée.";
  const entitiesToReplace = [...new Set(cleanData.map(r => String(r[0]).trim()))];
  const lastRow = sheet.getLastRow();
  
  let existingData = [];
  if (lastRow > 1) {
    const lastCol = sheet.getLastColumn();
    const readWidth = lastCol < headers.length ? headers.length : lastCol;
    const rawData = sheet.getRange(2, 1, lastRow - 1, readWidth).getValues();
    existingData = rawData.map(row => {
      let newRow = row.slice(0, headers.length);
      while(newRow.length < headers.length) newRow.push("");
      return newRow;
    });
  }
  
  const keptData = existingData.filter(row => !entitiesToReplace.includes(String(row[0]).trim()));
  const finalData = [...keptData, ...cleanData];
  
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  if (finalData.length > 0) {
    sheet.getRange(2, 1, finalData.length, headers.length).setValues(finalData);
  }
  
  const today = new Date();
  PropertiesService.getScriptProperties().setProperty('LAST_NONSOLDE_UPDATE', today.toLocaleString());
  return "Succès : Dossiers non soldés mis à jour pour " + entitiesToReplace.join(', ');
}

function getNonSoldesData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let lastUpdate = "--/--/----";
  try { 
    lastUpdate = PropertiesService.getScriptProperties().getProperty('LAST_NONSOLDE_UPDATE') || lastUpdate;
  } catch(e) {}

  const sheet = ss.getSheetByName("NON_SOLDE_FOCUS");
  if (!sheet || sheet.getLastRow() < 2) return { data: [], lastUpdate: lastUpdate };
  
  const rawData = sheet.getDataRange().getValues();
  return { data: rawData, lastUpdate: lastUpdate };
}

// =======================================================================
// 10. MODULE RH
// =======================================================================
// =======================================================================
// 10. MODULE RH
// =======================================================================

function testConnexionRH() {
  const ss = SpreadsheetApp.openById(RH_SPREADSHEET_ID);
  Logger.log("Fichier RH : " + ss.getName());

  const sheets = ss.getSheets().map(s => s.getName());
  Logger.log("Onglets RH :\n- " + sheets.join("\n- "));
}
/* =========================================================
   RH BACKEND – STABLE (DATES JJ/MM/AAAA -> MOIS = YYYY-MM)
   EFFECTIF TOTAL = KPI_CND -> "Nombre de personnel"
   + Sous-menu "Masse salariale & rubriques" (apiRHMasse)
   + KPIS (absentéisme / turnover / AT / AES)
   + EFFECTIF PAR TYPE DE CONTRAT
   + PROVISION DE CONGES PAYES
   ========================================================= */

const RH_CONF = {
  TABS: {
    KPI: "KPI_CND",
    GENRE: "RH - EFFECTIF - GENRE",
    AGE: "TRANCHE_D_AGE",
    MOUVEMENT: "MOUVEMENT",
    CATEGORIE: "RH - EFFECTIF - NB",
    KPIS: "KPIS",
    CONTRAT: "EFFECTIF PAR TYPE DE CONTRAT",
    CONGES: "PROVISION DE CONGES PAYES"
  }
};

// Onglets du sous-menu MASSE
const RH_MASSE_CONF = {
  TABS: {
    MASSE: "RH - MASSE VS BUDGET",
    VARS: "RH - VARIABLES TRAITEES" // fallback géré dans apiRHMasse
  }
};

function normalizeTout_(v) {
  const s = String(v || "").toUpperCase().trim();
  return (s === "TOUT") ? "ALL" : s;
}

function normalizeMoisTout_(v) {
  const s = String(v || "").toUpperCase().trim();
  return (s === "TOUT") ? "" : String(v || "").trim();
}
// =========================
// CACHE DONNÉES RH (fichier externe -> lecture coûteuse)
// =========================
const RH_CACHE_KEY = "RH_RAW_DATA_V1";
const RH_CACHE_TTL = 360; // secondes (6 min)

function getRHRawData_(forceRefresh) {
  const cache = CacheService.getScriptCache();

  if (!forceRefresh) {
    const cached = cache.get(RH_CACHE_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
  }

  const ss = SpreadsheetApp.openById(RH_SPREADSHEET_ID);

  const data = {
    KPI: readObjects_(ss, RH_CONF.TABS.KPI),
    GENRE: readObjects_(ss, RH_CONF.TABS.GENRE),
    AGE: readObjects_(ss, RH_CONF.TABS.AGE),
    MOUV: readObjects_(ss, RH_CONF.TABS.MOUVEMENT),
    CAT: readObjects_(ss, RH_CONF.TABS.CATEGORIE),
    KPIS: readObjects_(ss, RH_CONF.TABS.KPIS),
    CONTRAT: readObjects_(ss, RH_CONF.TABS.CONTRAT),
    CONGES: readObjects_(ss, RH_CONF.TABS.CONGES),
    MASSE: readObjects_(ss, RH_MASSE_CONF.TABS.MASSE),
    VARS: (function () {
      let v = readObjects_(ss, RH_MASSE_CONF.TABS.VARS);
      if (!v.length) v = readObjects_(ss, "RH - VARIABLES TRAITEES PAR RUBRIQUE");
      return v;
    })()
  };

  try {
    const json = JSON.stringify(data);
    if (json.length < 100000) {
      cache.put(RH_CACHE_KEY, json, RH_CACHE_TTL);
    } else {
      const chunks = [];
      for (let i = 0; i < json.length; i += 90000) chunks.push(json.slice(i, i + 90000));
      cache.put(RH_CACHE_KEY + "_N", String(chunks.length), RH_CACHE_TTL);
      chunks.forEach((c, idx) => cache.put(RH_CACHE_KEY + "_" + idx, c, RH_CACHE_TTL));
      cache.remove(RH_CACHE_KEY);
    }
  } catch (e) {
    Logger.log("Cache RH non sauvegardé : " + e.message);
  }

  return data;
}

// Lecture tenant compte du découpage en morceaux (>100Ko)
function getRHRawDataSafe_(forceRefresh) {
  const cache = CacheService.getScriptCache();
  if (!forceRefresh) {
    const single = cache.get(RH_CACHE_KEY);
    if (single) { try { return JSON.parse(single); } catch (e) {} }

    const nStr = cache.get(RH_CACHE_KEY + "_N");
    if (nStr) {
      const n = parseInt(nStr, 10);
      let json = "";
      let ok = true;
      for (let i = 0; i < n; i++) {
        const part = cache.get(RH_CACHE_KEY + "_" + i);
        if (part === null) { ok = false; break; }
        json += part;
      }
      if (ok) { try { return JSON.parse(json); } catch (e) {} }
    }
  }
  return getRHRawData_(forceRefresh);
}

// Appelable depuis le front pour forcer un rafraîchissement (bouton "🔄 Rafraîchir")
function apiRHRefreshCache() {
  getRHRawData_(true);
  return { ok: true };
}

/* =========================
   API RH – VUE GLOBALE
   ========================= */

function apiRH(params) {
  const ss = SpreadsheetApp.openById(RH_SPREADSHEET_ID);

  const entParamRaw = (params && params.entite) ? params.entite : "ALL";
  const moisParamRaw = (params && params.mois) ? params.mois : "";
  const entParam = normalizeTout_(entParamRaw);
  const moisParam = normalizeMoisTout_(moisParamRaw);

  const raw = getRHRawDataSafe_(params && params.forceRefresh);
const KPI = raw.KPI, GENRE = raw.GENRE, AGE = raw.AGE, MOUV = raw.MOUV,
      CAT = raw.CAT, KPIS = raw.KPIS, CONTRAT = raw.CONTRAT, CONGES = raw.CONGES;

  const entitesList = uniq_(splitEntites_([
    ...KPI.map(r => r.entite_norm),
    ...GENRE.map(r => r.entite_norm),
    ...AGE.map(r => r.entite_norm),
    ...MOUV.map(r => r.entite_norm),
    ...CAT.map(r => r.entite_norm),
    ...KPIS.map(r => r.entite_norm),
    ...CONTRAT.map(r => r.entite_norm),
    ...CONGES.map(r => r.entite_norm)
  ])).sort();

  const entites = ["ALL", ...entitesList];

  const moisList = uniq_([
    ...KPI.map(r => r.mois_norm),
    ...GENRE.map(r => r.mois_norm),
    ...AGE.map(r => r.mois_norm),
    ...MOUV.map(r => r.mois_norm),
    ...CAT.map(r => r.mois_norm),
    ...KPIS.map(r => r.mois_norm),
    ...CONTRAT.map(r => r.mois_norm),
    ...CONGES.map(r => r.mois_norm)
  ]).sort();

  const defaultMois = moisList.length ? moisList[moisList.length - 1] : "";
  const mois = moisParam || defaultMois;

  const isAll = (x) => String(x || "").toUpperCase().trim() === "ALL";

  const filt = (r) =>
    (isAll(entParam) || matchEntite_(r.entite_norm, entParam)) &&
    (mois ? (r.mois_norm === mois) : true);

  const kpis = buildKpisFromCnd_(KPI.filter(filt), entParam, mois, CAT.filter(filt), MOUV.filter(filt));

  const genreF = GENRE.filter(filt);
  const ageF = AGE.filter(filt);
  const mouvF = MOUV.filter(filt);
  const catF = CAT.filter(filt);
  const kpisExtraF = KPIS.filter(filt);
  const contratF = CONTRAT.filter(filt);
  const congesF = CONGES.filter(filt);

  const charts = {
    categorie: buildCategorie_(catF),
    flux: buildFlux_(mouvF),
    genre: buildGenre_(genreF),
    age: buildAge_(ageF),
    contrat: buildContrat_(contratF)
  };

  const kpisExtra = buildKpisExtra_(kpisExtraF);
  const conges = buildConges_(congesF);

  return {
    filters: { entites, mois: moisList, defaultMois },
    kpis,
    kpisExtra,
    charts,
    conges
  };
}

// ---------- HISTORIQUE (modal courbe) ----------
function apiRHHistory(params) {
  const ss = SpreadsheetApp.openById(RH_SPREADSHEET_ID);

  const ent = normalizeTout_((params && params.entite) ? params.entite : "ALL");
  const kind = String((params && params.kind) || "").trim();
  const key = String((params && params.key) || "").trim();

  const GENRE = readObjects_(ss, RH_CONF.TABS.GENRE);
  const AGE = readObjects_(ss, RH_CONF.TABS.AGE);
  const MOUV = readObjects_(ss, RH_CONF.TABS.MOUVEMENT);
  const CAT = readObjects_(ss, RH_CONF.TABS.CATEGORIE);

  const match = (r) => (ent === "ALL") ? true : matchEntite_(r.entite_norm, ent);

  const months = uniq_([
    ...GENRE.filter(match).map(r => r.mois_norm),
    ...AGE.filter(match).map(r => r.mois_norm),
    ...MOUV.filter(match).map(r => r.mois_norm),
    ...CAT.filter(match).map(r => r.mois_norm)
  ]).sort();

  const byMonth = (rows) => {
    const map = {};
    rows.forEach(r => {
      const m = r.mois_norm || "";
      if (!m) return;
      if (!map[m]) map[m] = [];
      map[m].push(r);
    });
    return map;
  };

  if (!kind) return { months, points: [], label: "" };

  if (kind === "age") {
    const map = byMonth(AGE.filter(match));
    const bucket = mapAgeKey_(key);
    const points = months.map(m => {
      const obj = buildAge_(map[m] || []);
      return { mois: m, value: Number(obj[bucket] || 0) };
    });
    return { months, points, label: key };
  }

  if (kind === "categorie") {
    const map = byMonth(CAT.filter(match));
    const field = mapCategorieField_(key);
    const points = months.map(m => {
      const obj = buildCategorie_(map[m] || []);
      return { mois: m, value: Number(obj[field] || 0) };
    });
    return { months, points, label: key };
  }

  if (kind === "genre") {
    const map = byMonth(GENRE.filter(match));
    const field = mapGenreKey_(key);
    const points = months.map(m => {
      const obj = buildGenre_(map[m] || []);
      return { mois: m, value: Number(obj[field] || 0) };
    });
    return { months, points, label: key };
  }

  if (kind === "flux") {
    const map = byMonth(MOUV.filter(match));
    const field = mapFluxKey_(key);
    const points = months.map(m => {
      const obj = buildFlux_(map[m] || []);
      return { mois: m, value: Number(obj[field] || 0) };
    });
    return { months, points, label: key };
  }

  return { months, points: [], label: "" };
}

/* =========================
   API RH – MASSE SALARIALE & RUBRIQUES
   ========================= */

function apiRHMasse(params) {
  const raw = getRHRawDataSafe_(params && params.forceRefresh);

  const entParamRaw = (params && params.entite) ? params.entite : "ALL";
  const moisParamRaw = (params && params.mois) ? params.mois : "";
  const entParam = normalizeTout_(entParamRaw);
  const moisParam = normalizeMoisTout_(moisParamRaw);

  const MASSE = raw.MASSE;
  let VARS = raw.VARS;

  const entitesList = uniq_(splitEntites_([
    ...MASSE.map(r => r.entite_norm),
    ...VARS.map(r => r.entite_norm)
  ])).sort();

  const moisList = uniq_([
    ...MASSE.map(r => r.mois_norm),
    ...VARS.map(r => r.mois_norm)
  ]).sort();

  const defaultMois = moisList.length ? moisList[moisList.length - 1] : "";
  const mois = moisParam || defaultMois;

  const isAll = (x) => String(x || "").toUpperCase().trim() === "ALL";
  const entOk = (rowEnt) => isAll(entParam) ? true : matchEntite_(rowEnt, entParam);

  // Séries MASSE (Budget/Réalisé/%)
  const months = moisList.slice();
  const byMonth = {};
  months.forEach(m => byMonth[m] = { real: 0, budget: 0 });

  MASSE.forEach(r => {
    if (!r.mois_norm) return;
    if (!entOk(r.entite_norm)) return;

    const m = r.mois_norm;
    if (!byMonth[m]) byMonth[m] = { real: 0, budget: 0 };

    byMonth[m].real += num_(r.mstraiteesansvariables);
    byMonth[m].budget += num_(r.budgetsansvariable);
  });

  const serieReal = months.map(m => +(byMonth[m]?.real || 0));
  const serieBudget = months.map(m => +(byMonth[m]?.budget || 0));
  const seriePct = months.map((m, i) => {
    const b = serieBudget[i];
    const r = serieReal[i];
    if (!b) return null;
    return +((r / b) * 100);
  });

  // Séries VARIABLES (Actes/Garde/DF/Autres + total)
  const varsByMonth = {};
  months.forEach(m => varsByMonth[m] = { actes: 0, garde: 0, df: 0, autres: 0, total: 0 });

  VARS.forEach(r => {
    if (!r.mois_norm) return;
    if (!entOk(r.entite_norm)) return;

    const m = r.mois_norm;
    if (!varsByMonth[m]) varsByMonth[m] = { actes: 0, garde: 0, df: 0, autres: 0, total: 0 };

    varsByMonth[m].actes += num_(r.actes);
    varsByMonth[m].garde += num_(r.garde);
    varsByMonth[m].df += num_(r.df);
    varsByMonth[m].autres += num_(r.autreshsastreintesprimesvar ?? r.autres);
    varsByMonth[m].total += num_(r.totalsansnd);
  });

  const varsSeries = months.map(m => ({
    mois: m,
    actes: +(varsByMonth[m]?.actes || 0),
    garde: +(varsByMonth[m]?.garde || 0),
    df: +(varsByMonth[m]?.df || 0),
    autres: +(varsByMonth[m]?.autres || 0),
    total: +(varsByMonth[m]?.total || 0)
  }));

  const selectedMasse = (() => {
    const r = byMonth[mois] || { real: 0, budget: 0 };
    const pct = (r.budget ? (r.real / r.budget) * 100 : null);
    return { mois, real: +r.real, budget: +r.budget, pct: (pct === null ? null : +pct) };
  })();

  const selectedVars = (() => {
    const v = varsByMonth[mois] || { actes: 0, garde: 0, df: 0, autres: 0, total: 0 };
    const total = +v.total || 0;
    const pct = (x) => total ? (x / total) * 100 : 0;
    return {
      mois,
      actes: +v.actes,
      garde: +v.garde,
      df: +v.df,
      autres: +v.autres,
      total: +v.total,
      pct: {
        actes: +pct(+v.actes),
        garde: +pct(+v.garde),
        df: +pct(+v.df),
        autres: +pct(+v.autres)
      }
    };
  })();

  return {
    ok: true,
    filters: { entites: ["ALL", ...entitesList], mois: moisList, defaultMois },
    state: { entite: entParam, mois },
    series: { months, budget: serieBudget, real: serieReal, pct: seriePct },
    varsSeries,
    selected: { masse: selectedMasse, vars: selectedVars }
  };
}

/* =========================
   API RH – PROVISION CONGES PAYES (page dédiée)
   ========================= */

function apiRHConges(params) {
  const raw = getRHRawDataSafe_(params && params.forceRefresh);

  const entParamRaw = (params && params.entite) ? params.entite : "ALL";
  const moisParamRaw = (params && params.mois) ? params.mois : "";
  const entParam = normalizeTout_(entParamRaw);
  const moisParam = normalizeMoisTout_(moisParamRaw);

  const CONGES = raw.CONGES;

  const entitesList = uniq_(splitEntites_(CONGES.map(r => r.entite_norm))).sort();
  const moisList = uniq_(CONGES.map(r => r.mois_norm)).sort();
  const defaultMois = moisList.length ? moisList[moisList.length - 1] : "";
  const mois = moisParam || defaultMois;

  const isAll = (x) => String(x || "").toUpperCase().trim() === "ALL";

  // Vue globale pour le mois sélectionné (toutes entités ou une seule)
  const filt = (r) =>
    (isAll(entParam) || matchEntite_(r.entite_norm, entParam)) &&
    (mois ? (r.mois_norm === mois) : true);

  const selected = buildConges_(CONGES.filter(filt));

  // Série temporelle (pour le graphique) sur l'entité sélectionnée (ou ALL)
  const entFilt = (r) => isAll(entParam) || matchEntite_(r.entite_norm, entParam);
  const byMonth = {};
  CONGES.filter(entFilt).forEach(r => {
    const m = r.mois_norm;
    if (!m) return;
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(r);
  });

  const series = moisList.map(m => {
    const obj = buildConges_(byMonth[m] || []);
    return { mois: m, ...obj };
  });

  // Détail par entité pour le mois sélectionné
  const byEnt = {};
  CONGES.filter(r => (mois ? (r.mois_norm === mois) : true)).forEach(r => {
    const e = r.entite_norm || "N/D";
    if (!byEnt[e]) byEnt[e] = [];
    byEnt[e].push(r);
  });
  const detailParEntite = Object.keys(byEnt).sort().map(e => {
    const obj = buildConges_(byEnt[e]);
    return { entite: e, ...obj };
  });

  return {
    filters: { entites: ["ALL", ...entitesList], mois: moisList, defaultMois },
    state: { entite: entParam, mois },
    selected,
    series,
    detailParEntite
  };
}

/* =========================
   BUILDERS
   ========================= */

function buildKpisFromCnd_(rows, ent, mois, catRows, mouvRows) {
  const sum = (k) => rows.reduce((a, r) => a + num_(r[k]), 0);

  // effectif total = RH - EFFECTIF - NB (paramédical + direction + hébergement + stagiaires)
  const sumCat = (k) => (catRows || []).reduce((a, r) => a + num_(r[k]), 0);
  const effectifTotal =
    sumCat("paramedical") + sumCat("direction") + sumCat("hebergement") +
    sumCat("stagiaires") + sumCat("stagiaire") + sumCat("stagiere") + sumCat("stg");

  // Recrutements / Départs = MOUVEMENT (type ENTRANTS / SORTANTS)
  const flux = buildFlux_(mouvRows || []);
  const nbRecrutements = flux.in;
  const nbDeparts = flux.out;

  const patients = sum("nombredepatients");
  const personnel = effectifTotal;

  return {
    scope: { entite: ent, mois },
    rows: rows.length,
    effectifTotal,
    nbRecrutements,
    nbDeparts,
    patients,
    personnel,
    ratioPatientsPersonnel: personnel > 0 ? (patients / personnel) : null
  };
}

function buildGenre_(rows) {
  let femmes = 0, hommes = 0;
  rows.forEach(r => {
    femmes += num_(r["femmes"]);
    hommes += num_(r["hommes"]);
  });
  return { femmes, hommes };
}

// AGE (robuste)
function buildAge_(rows) {
  const out = { "20-30": 0, "30-45": 0, "45-55": 0, ">55": 0 };

  rows.forEach(r => {
    const raw = String(
      r["tranchedage"] ??
      r["tranche_d_age"] ??
      r["trancheage"] ??
      r["tranche"] ??
      r["tranche d age"] ??
      ""
    );

    const label = normTxt_(raw);
    const v = num_(r["effectif"] ?? r["effectifs"] ?? r["nb"] ?? r["nombre"] ?? r["valeur"] ?? 0);

    if (/20\D*30/.test(label)) out["20-30"] += v;
    else if (/30\D*45/.test(label)) out["30-45"] += v;
    else if (/45\D*55/.test(label) && !/>\D*55/.test(label)) out["45-55"] += v;
    else if (/>+\D*55/.test(label) || /plus\D*de\D*55/.test(label) || (/55\D*ans/.test(label) && !/45\D*55/.test(label))) out[">55"] += v;
  });

  return out;
}

// KPIS (taux d'absentéisme, turn over, AT, AES)
function buildKpisExtra_(rows) {
  const sum = (k) => rows.reduce((a, r) => a + num_(r[k]), 0);
  const avg = (k) => rows.length ? sum(k) / rows.length : 0;

  return {
    rows: rows.length,
    tauxAbsenteisme: avg("tauxdabsenteisme"),
    turnover: avg("turnover"),
    at: sum("at"),
    aes: sum("aes")
  };
}

// EFFECTIF PAR TYPE DE CONTRAT
function buildContrat_(rows) {
  let cdi = 0, cdd = 0, stage = 0, nd = 0;
  rows.forEach(r => {
    cdi += num_(r["cdi"]);
    cdd += num_(r["cdd"]);
    stage += num_(r["stage"]);
    nd += num_(r["nd"]);
  });
  return { "CDI": cdi, "CDD": cdd, "STAGE": stage, "ND": nd };
}

// PROVISION DE CONGES PAYES
function buildConges_(rows) {
  let nbPersonnel = 0, totalJours = 0, provisionTotale = 0;
  rows.forEach(r => {
    nbPersonnel += num_(r["nbredepersonnel"]);
    totalJours += num_(r["totaljours"]);
    provisionTotale += num_(r["provisiontotalemad"]);
  });
  return {
    rows: rows.length,
    nbPersonnel,
    totalJours,
    provisionTotale
  };
}

function buildFlux_(rows) {
  let in_ = 0, out_ = 0;

  rows.forEach(r => {
    if (r["entrants"] !== undefined || r["sortants"] !== undefined) {
      in_ += num_(r["entrants"]);
      out_ += num_(r["sortants"]);
      return;
    }
    const type = String(r["type"] || "").toUpperCase();
    const eff = num_(r["effectif"]);
    if (type.includes("ENTR")) in_ += eff;
    if (type.includes("SORT")) out_ += eff;
  });

  return { in: in_, out: out_ };
}

// CATEGORIE
function buildCategorie_(rows) {
  let paramedical = 0, direction = 0, hebergement = 0, stagiaires = 0;

  rows.forEach(r => {
    paramedical += num_(r["paramedical"]);
    direction += num_(r["direction"]);
    hebergement += num_(r["hebergement"]);
    stagiaires += num_(r["stagiaires"] ?? r["stagiaire"] ?? r["stagiere"] ?? r["stg"] ?? 0);
  });

  return {
    "Paramédical": paramedical,
    "Direction": direction,
    "Hébergement": hebergement,
    "Stagiaires": stagiaires,
    paramedical, direction, hebergement, stagiaires
  };
}

/* =========================
   READERS & HELPERS
   ========================= */

function readObjects_(ss, tabName) {
  const sh = ss.getSheetByName(tabName);
  if (!sh) return [];

  const values = sh.getDataRange().getValues();
  if (!values || values.length < 2) return [];

  const headersRaw = values[0].map(h => String(h || "").trim());
  const headers = headersRaw.map(h => normKey_(h));

  const iEnt = headers.findIndex(h => h.includes("entite"));
  const iMois = headers.findIndex(h => h === "mois" || h.includes("date"));

  const out = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || row.every(v => v === "" || v === null || v === undefined)) continue;

    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      const k = headers[c];
      if (!k) continue;
      obj[k] = row[c];
    }

    obj.entite_norm = (iEnt >= 0 ? String(row[iEnt] || "") : "").toUpperCase().trim();
    obj.mois_norm = (iMois >= 0 ? monthKey_(row[iMois]) : "");

    out.push(obj);
  }

  return out;
}

function normKey_(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normTxt_(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9> ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function monthKey_(v) {
  if (v instanceof Date && !isNaN(v)) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  const s = String(v || "").trim();
  if (!s) return "";

  if (/^\d{4}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.substring(0, 7);

  const m1 = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (m1) return `${m1[3]}-${String(m1[2]).padStart(2, "0")}`;

  return s.length >= 7 ? s.substring(0, 7) : s;
}

function num_(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  let s = String(v).trim().replace(/\s/g, "").replace(",", ".");
  let isPct = s.includes("%");
  s = s.replace("%", "");
  const n = Number(s);
  if (isNaN(n)) return 0;
  return isPct ? n / 100 : n; // "0,83%" -> 0.0083
}

function uniq_(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function splitEntites_(arr) {
  const out = [];
  (arr || []).forEach(e => {
    const s = String(e || "").toUpperCase().trim();
    if (!s) return;
    if (s.includes("/")) s.split("/").forEach(x => { const v = x.trim(); if (v) out.push(v); });
    else out.push(s);
  });
  return out;
}

function matchEntite_(rowEnt, wanted) {
  const re = String(rowEnt || "").toUpperCase().trim();
  let w = String(wanted || "").toUpperCase().trim();
  if (!re || !w) return false;

  // Normalisations de libellés côté UI
  if (w === "HIA CIOA") w = "HIA/CIOA";

  // On supporte les deux côtés avec "/" :
  // - re = "HIA/CIOA" et w = "HIA"
  // - re = "HIA" et w = "HIA/CIOA"
  const rParts = re.includes("/") ? re.split("/").map(x => x.trim()).filter(Boolean) : [re];
  const wParts = w.includes("/") ? w.split("/").map(x => x.trim()).filter(Boolean) : [w];

  // match si intersection non vide
  return rParts.some(p => wParts.includes(p));
}

function mapCategorieField_(label) {
  const k = normTxt_(label);
  if (k.includes("param")) return "paramedical";
  if (k.includes("dir")) return "direction";
  if (k.includes("heb")) return "hebergement";
  if (k.includes("stag")) return "stagiaires";
  return "paramedical";
}

function mapGenreKey_(label) {
  const k = normTxt_(label);
  if (k.includes("hom")) return "hommes";
  return "femmes";
}

function mapFluxKey_(label) {
  const k = normTxt_(label);
  if (k.includes("sort") || k.includes("out")) return "out";
  return "in";
}

function mapAgeKey_(label) {
  const k = normTxt_(label);
  if (k.includes("20") && k.includes("30")) return "20-30";
  if (k.includes("30") && k.includes("45")) return "30-45";
  if (k.includes("45") && k.includes("55") && !k.includes(">")) return "45-55";
  return ">55";
}
// =======================================================================
// 11. IMPORT DÉTAIL (REC & EXP)
// =======================================================================

function importDetailsOrganisme() {
  try {
    const sourceSS = SpreadsheetApp.openById(REC_EXP_SOURCE_ID);
    const localSS = SpreadsheetApp.getActiveSpreadsheet();

    function getDateParts(d) {
      if (!d || !(d instanceof Date)) return [0, 0, 0];
      return [d.getDate(), d.getMonth() + 1, d.getFullYear()];
    }

    function processExpeditionFixed() {
      let srcSheet = null;
      const names = ["BDD EXP", "EXPEDITION", "EXP", "DATA EXP"];
      for (let n of names) { srcSheet = sourceSS.getSheetByName(n); if(srcSheet) break; }
      if (!srcSheet) return "⚠️ Onglet EXP introuvable";

      const data = srcSheet.getDataRange().getValues();
      if (data.length < 2) return "⚠️ Onglet EXP vide";

      let output = [["Entité", "Jour", "Mois", "Année", "Organisme", "Montant"]];
      let count = 0;

      const colEntite = 3;
      const colOrg = 5;
      const colMontant = 12;
      const colDate = 18;

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[colEntite] && row[colEntite] !== 0) continue;
        
        const entite = row[colEntite];
        const orgVal = row[colOrg] || "Inconnu";
        
        let mntVal = row[colMontant];
        if (typeof mntVal !== 'number') {
          mntVal = parseFloat(String(mntVal).replace(/[\s,]/g, (m) => m === ',' ? '.' : '')) || 0;
        }

        let rawDate = row[colDate];
        let finalDate = null;
        if (rawDate instanceof Date) {
          finalDate = rawDate;
        } else if (rawDate) {
          let s = String(rawDate).trim();
          if (s.length >= 8) {
            let parts = s.split(/[\/\-\.]/);
            if (parts.length === 3) finalDate = new Date(parts[2], parts[1] - 1, parts[0]);
          }
        }

        if (finalDate && !isNaN(finalDate.getTime())) {
          const [jj, mm, aa] = getDateParts(finalDate);
          output.push([entite, jj, mm, aa, orgVal, mntVal]);
          count++;
        }
      }

      let targetSheet = localSS.getSheetByName("DETAIL EXP");
      if (!targetSheet) targetSheet = localSS.insertSheet("DETAIL EXP");
      targetSheet.clear();
      
      if (output.length > 1) {
        targetSheet.getRange(1, 1, output.length, output[0].length).setValues(output);
        return count + " lignes";
      }
      return "0 ligne importée";
    }

    function processRecouvrementSmart() {
      let srcSheet = null;
      const names = ["BDD REC", "REC", "RECOUVREMENT"];
      for (let n of names) { srcSheet = sourceSS.getSheetByName(n); if(srcSheet) break; }
      if (!srcSheet) return "⚠️ Onglet REC introuvable";

      const data = srcSheet.getDataRange().getValues();
      if (data.length < 2) return "⚠️ Onglet REC vide";
      
      let output = [["Entité", "Jour", "Mois", "Année", "Organisme", "Montant"]];
      let count = 0;
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        let ent = row[2]; 
        let dt = row[3];
        let org = row[4];
        let mnt = row[5];
        
        if(ent) {
          if(typeof mnt !== 'number') mnt = parseFloat(String(mnt).replace(/[\s,]/g, (m) => m === ',' ? '.' : '')) || 0;
          let fDate = (dt instanceof Date) ? dt : null;
          if(!fDate && dt) { let p = String(dt).split('/'); if(p.length===3) fDate = new Date(p[2], p[1]-1, p[0]); }
          
          if(fDate) {
            const [jj,mm,aa] = getDateParts(fDate);
            output.push([ent, jj, mm, aa, org, mnt]);
            count++;
          }
        }
      }
      
      let targetSheet = localSS.getSheetByName("DETAIL REC");
      if (!targetSheet) targetSheet = localSS.insertSheet("DETAIL REC");
      targetSheet.clear();
      if (output.length > 1) targetSheet.getRange(1, 1, output.length, output[0].length).setValues(output);
      return count + " lignes";
    }

    const resExp = processExpeditionFixed();
    const resRec = processRecouvrementSmart();

    return "✅ Import Terminé.\nEXP: " + resExp + "\nREC: " + resRec;

  } catch (e) {
    return "❌ Erreur : " + e.message;
  }
}

function getDetailsOrganismeData(type) {
  const sheetName = (type === 'EXP') ? 'DETAIL EXP' : 'DETAIL REC';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data;
}

// =======================================================================
// GESTION VERSION
// =======================================================================

function incrementAppVersion() {
  const props = PropertiesService.getScriptProperties();
  let currentVersion = props.getProperty('APP_VERSION');
  if (!currentVersion) currentVersion = "v1.0.0";
  
  let parts = currentVersion.replace('v', '').split('.');
  if (parts.length === 3) {
    parts[2] = parseInt(parts[2]) + 1; 
  } else {
    parts = ["1", "0", "1"];
  }
  
  const newVersion = "v" + parts.join('.');
  props.setProperty('APP_VERSION', newVersion);
  
  SpreadsheetApp.getUi().alert(
    "✅ Version mise à jour !\n\n" +
    "Ancienne : " + currentVersion + "\n" +
    "Nouvelle : " + newVersion + "\n\n" +
    "⚠️ Faites un nouveau déploiement pour appliquer."
  );
}
// =======================================================================
// 8. MODULE ACHAT
// =======================================================================

/**
 * Retourne les données consolidées du module Achat :
 *   - data          : lignes de BDD_CND_APP (à partir de la ligne 3)
 *   - headers       : en-têtes réels (ligne 2)
 *   - budget        : lignes de Index_buget (à partir de la ligne 2)
 *   - budgetHeaders : en-têtes du budget (ligne 1)
 *   - lastUpdate    : date/heure de dernière MAJ
 *
 * Note structure BDD_CND_APP :
 *   - Ligne 1 : en-têtes de GROUPE fusionnés ("Info demande d'achat", "Article"...) → ignorée
 *   - Ligne 2 : en-têtes de COLONNES réels (Demande, Site, Statut DA...)
 *   - Lignes 3+ : données
 */
/**
 * MODIFICATION MINIMALE de getAchatData() existant
 * Ajouter UNIQUEMENT les lignes marquées // ← NOUVEAU
 * Le reste de ta fonction reste identique
 */
function getAchatData() {
  const result = {
    data: [],
    headers: [],
    budget: [],
    budgetHeaders: [],
    consoN1: [],          // ← NOUVEAU
    lastUpdate: "--/--/----"
  };
  
  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    
    // --- BDD_CND_APP --- (ton code existant, ne change pas)
    const sheetAchat = ss.getSheetByName("BDD_CND_APP");
    if (sheetAchat) {
      const lastRow = sheetAchat.getLastRow();
      const lastCol = sheetAchat.getLastColumn();
      if (lastRow >= 3 && lastCol >= 1) {
        const rawHeaders = sheetAchat.getRange(2, 1, 1, lastCol).getValues()[0];
        const rawData    = sheetAchat.getRange(3, 1, lastRow - 2, lastCol).getValues();
        result.headers = rawHeaders.map(h => String(h || ""));
        result.data = rawData.map(row => row.map(cell => {
          if (cell instanceof Date) {
            const d  = cell.getDate().toString().padStart(2, '0');
            const m  = (cell.getMonth() + 1).toString().padStart(2, '0');
            const y  = cell.getFullYear();
            const h  = cell.getHours().toString().padStart(2, '0');
            const mn = cell.getMinutes().toString().padStart(2, '0');
            return `${d}/${m}/${y} ${h}:${mn}`;
          }
          if (cell === null || cell === undefined) return "";
          return cell;
        }));
      }
    }
    
    // --- Index_buget --- (ton code existant, ne change pas)
    const sheetBudget = ss.getSheetByName("Index_buget");
    if (sheetBudget) {
      const lastRowB = sheetBudget.getLastRow();
      const lastColB = sheetBudget.getLastColumn();
      if (lastRowB >= 2 && lastColB >= 1) {
        const rawHeadersB = sheetBudget.getRange(1, 1, 1, lastColB).getValues()[0];
        const rawBudget   = sheetBudget.getRange(2, 1, lastRowB - 1, lastColB).getValues();
        result.budgetHeaders = rawHeadersB.map(h => String(h || ""));
        result.budget = rawBudget.map(row => row.map(cell => {
          if (cell instanceof Date) {
            const d = cell.getDate().toString().padStart(2, '0');
            const m = (cell.getMonth() + 1).toString().padStart(2, '0');
            const y = cell.getFullYear();
            return `${d}/${m}/${y}`;
          }
          if (cell === null || cell === undefined) return "";
          return cell;
        }));
      }
    }

    // ← NOUVEAU : --- index_6_2025 (conso N-1, 18 colonnes) ---
    const sheetN1 = ss.getSheetByName("index_6_2025");
    if (sheetN1) {
      const lastRowN1 = sheetN1.getLastRow();
      const lastColN1 = sheetN1.getLastColumn();
      if (lastRowN1 >= 2 && lastColN1 >= 1) {
        const rawN1 = sheetN1
          .getRange(2, 1, lastRowN1 - 1, Math.min(lastColN1, 18))
          .getValues();
        // Pas de dates dans cette feuille, mais on nettoie les null
        result.consoN1 = rawN1.map(row => row.map(cell => {
          if (cell === null || cell === undefined) return "";
          return cell;
        }));
      }
      Logger.log("✅ index_6_2025 : " + result.consoN1.length + " lignes");
    } else {
      Logger.log("⚠️ index_6_2025 introuvable — N-1 non chargé");
    }
    // ← FIN NOUVEAU

    const prop = PropertiesService.getScriptProperties().getProperty('LAST_ACHAT_UPDATE');
    if (prop) result.lastUpdate = prop;
    
  } catch(e) {
    Logger.log("Erreur getAchatData : " + e.message + "\n" + e.stack);
  }
  
  return result;
}
// ════════════════════════════════════════════════════════════════════
// ACHAT — CONSOMMATION VS BUDGET
// À ajouter dans Code.gs
// ════════════════════════════════════════════════════════════════════

function getAchatConsoData(params) {
  params = params || {};
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── Index colonnes BDD_CND_APP (0-based, A=0) ──
  const C = {
    SITE          : 1,   // B
    DATE_CRE_DA   : 6,   // G  — Date de création DA
    DATE_VAL1     : 11,  // L  — Date de validation 1
    DATE_VAL2     : 13,  // N  — Date de validation 2
    DATE_VAL3     : 15,  // P  — Date de validation 3
    SECTION       : 24,  // Y
    SOUS_FAM      : 25,  // Z  — Sous-famille
    FAMILLE       : 26,  // AA
    CODE_CPT      : 27,  // AB — Code comptable
    ID_LIGNE      : 30,  // AE — ID ligne commande (déduplication)
    FOURNISSEUR   : 31,  // AF
    STATUT_BC     : 32,  // AG — exclure 'Rejeté'
    DATE_CRE_BC   : 34,  // AI — Date de création BC
    DATE_VALID_BC : 36,  // AK — Date de validation BC
    MONTANT_HT    : 37,  // AL
    MONTANT_TTC   : 38,  // AM — montant utilisé pour les KPIs
    VALEUR_ECO    : 40,  // AO — Valeur économisée TTC
  };

  const parseDate = function(v) {
    if (!v || v === '') return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  const M2T = {1:1,2:1,3:1,4:2,5:2,6:2,7:3,8:3,9:3,10:4,11:4,12:4};
  const pYear = params.annee  ? parseInt(params.annee)  : null;
  const pTri  = params.trim   ? parseInt(params.trim)   : null;
  const pMois = params.mois   ? parseInt(params.mois)   : null;
  const pSite = params.site   || null;
  const pSect = params.section || null;
  const pSF   = params.sousFam || null;

  // ════════════════════════════════
  // 1. LECTURE + NETTOYAGE BDD_CND_APP
  //    Exclure Rejeté (col AG)
  //    Dédoublonner sur ID ligne commande (col AE)
  // ════════════════════════════════
  const bddSheet = ss.getSheetByName('BDD_CND_APP');
  if (!bddSheet) throw new Error("Feuille BDD_CND_APP introuvable");
  const bddRaw = bddSheet.getDataRange().getValues();

  const seen    = new Set();
  const allRows = [];

  for (var i = 2; i < bddRaw.length; i++) {
    var r = bddRaw[i];
    if (!r[C.SITE]) continue;

    // Exclure Rejeté
    var statut = String(r[C.STATUT_BC] || '').trim();
    if (statut === 'Rejeté') continue;

    // Dédoublonnage
    var idLigne = String(r[C.ID_LIGNE] || '').trim();
    if (idLigne) {
      if (seen.has(idLigne)) continue;
      seen.add(idLigne);
    }
    allRows.push(r);
  }

  // ════════════════════════════════
  // 2. OPTIONS POUR LES FILTRES FRONTEND
  // ════════════════════════════════
  var setSites    = {};
  var setSections = {};
  var setSF       = {};
  allRows.forEach(function(r) {
    if (r[C.SITE])     setSites[String(r[C.SITE]).trim()]     = 1;
    if (r[C.SECTION])  setSections[String(r[C.SECTION]).trim()] = 1;
    if (r[C.SOUS_FAM]) setSF[String(r[C.SOUS_FAM]).trim()]    = 1;
  });
  var filterOptions = {
    sites     : Object.keys(setSites).sort(),
    sections  : Object.keys(setSections).sort(),
    sousFams  : Object.keys(setSF).sort(),
  };

  // ════════════════════════════════
  // 3. APPLICATION DES FILTRES PÉRIODE/DIMENSIONS
  // ════════════════════════════════
  var rows = allRows.filter(function(r) {
    var d = parseDate(r[C.DATE_CRE_BC]);
    if (!d) return false;
    var m = d.getMonth() + 1;
    if (pYear && d.getFullYear() !== pYear)  return false;
    if (pTri  && M2T[m]          !== pTri)   return false;
    if (pMois && m               !== pMois)  return false;
    if (pSite && String(r[C.SITE]).trim()     !== pSite) return false;
    if (pSect && String(r[C.SECTION]).trim()  !== pSect) return false;
    if (pSF   && String(r[C.SOUS_FAM]).trim() !== pSF)   return false;
    return true;
  });

  // ════════════════════════════════
  // 4. CALCUL KPIs
  // ════════════════════════════════
  var totalEngage = 0, totalSaving = 0;
  var dBCsum = 0, dBCn = 0;
  var dDAsum = 0, dDAn = 0;

  var byCPT  = {};
  var bySF   = {};
  var sfToCpts = {};   // Sous-famille → Set de codes comptables

  var epoch2000 = new Date('2000-01-01').getTime();

  rows.forEach(function(r) {
    var ttc = parseFloat(r[C.MONTANT_TTC]) || 0;
    var eco = parseFloat(r[C.VALEUR_ECO])  || 0;
    totalEngage += ttc;
    totalSaving += eco;

    // Délai acheteur : dernière date de validation → Date création BC
    var v1 = parseDate(r[C.DATE_VAL1]);
    var v2 = parseDate(r[C.DATE_VAL2]);
    var v3 = parseDate(r[C.DATE_VAL3]);
    var dCreBC = parseDate(r[C.DATE_CRE_BC]);

    var lastV = v1;
    if (v2 && v2.getTime() > epoch2000) lastV = v2;
    if (v3 && v3.getTime() > epoch2000) lastV = v3;

    if (lastV && dCreBC) {
      var diffBC = (dCreBC.getTime() - lastV.getTime()) / 86400000;
      if (diffBC >= 0) { dBCsum += diffBC; dBCn++; }
    }

    // Délai traitement DA : Date création DA → Date validation BC
    var dCreDA = parseDate(r[C.DATE_CRE_DA]);
    var dValBC = parseDate(r[C.DATE_VALID_BC]);
    if (dCreDA && dValBC) {
      var diffDA = (dValBC.getTime() - dCreDA.getTime()) / 86400000;
      if (diffDA >= 0) { dDAsum += diffDA; dDAn++; }
    }

    // Agrégations
    var cpt  = String(r[C.CODE_CPT]  || 'N/A').trim();
    var sf   = String(r[C.SOUS_FAM]  || 'Autre').trim();

    byCPT[cpt] = (byCPT[cpt] || 0) + ttc;
    bySF[sf]   = (bySF[sf]   || 0) + ttc;

    if (!sfToCpts[sf]) sfToCpts[sf] = {};
    sfToCpts[sf][cpt] = 1;
  });

  // ════════════════════════════════
  // 5. BUDGET (Index_buget)
  //    Cols : A(0)Sites CDG · B(1)Sites · C(2)Compte · D(3)Compte CDG
  //           E(4)Description · F(5)Libellé · G(6)Postes PC
  //           H(7)Affectation · I(8)Mois · J(9)Montant
  // ════════════════════════════════
  var budSheet = ss.getSheetByName('Index_buget');
  if (!budSheet) throw new Error("Feuille Index_buget introuvable");
  var budRaw = budSheet.getDataRange().getValues();

  var ML = {
    'Janvier':1,'Février':2,'Mars':3,'Avril':4,'Mai':5,'Juin':6,
    'Juillet':7,'Août':8,'Septembre':9,'Octobre':10,'Novembre':11,'Décembre':12
  };

  var totalBudget = 0;
  var budByCPT    = {};

  for (var bi = 1; bi < budRaw.length; bi++) {
    var br = budRaw[bi];
    var bSite  = String(br[1] || '').trim();
    var bCpt   = String(br[2] || '').trim();
    var bDesc  = String(br[4] || '').trim();
    var bPoste = String(br[6] || '').trim();
    var bMois  = String(br[8] || '').trim();
    var bMont  = parseFloat(br[9]) || 0;
    if (!bMont) continue;

    // Filtrer familles 2.1-3.7
    var isCible = /\b[23]\.\d/.test(bDesc) || /^[23]\.\d/.test(bPoste);
    if (!isCible) continue;

    var bm = ML[bMois];
    if (!bm) continue;
    if (pSite && bSite !== pSite) continue;
    if (pTri  && M2T[bm] !== pTri)  continue;
    if (pMois && bm      !== pMois)  continue;

    totalBudget += bMont;
    budByCPT[bCpt] = (budByCPT[bCpt] || 0) + bMont;
  }

  // Budget par sous-famille (via mapping sfToCpts)
  var budBySF = {};
  Object.keys(sfToCpts).forEach(function(sf) {
    var total = 0;
    Object.keys(sfToCpts[sf]).forEach(function(c) { total += budByCPT[c] || 0; });
    budBySF[sf] = total;
  });

  // ════════════════════════════════
  // 6. CONSO 2025 (index_6_2025)
  //    Cols : A(0)Sites · B(1)Compte · C(2)Description · D(3)Libellé
  //           E(4)PostesPC · F(5)Affectation
  //           G(6)JANVIER … R(17)DÉCEMBRE
  // ════════════════════════════════
  var c25Sheet = ss.getSheetByName('index_6_2025');
  if (!c25Sheet) throw new Error("Feuille index_6_2025 introuvable");
  var c25Raw = c25Sheet.getDataRange().getValues();

  var totalConso25 = 0;
  var c25ByCPT     = {};

  for (var ci = 1; ci < c25Raw.length; ci++) {
    var cr = c25Raw[ci];
    var cSite = String(cr[0] || '').trim();
    var cCpt  = String(cr[1] || '').trim();
    if (pSite && cSite !== pSite) continue;

    var cMont = 0;
    if (pMois) {
      // Colonne du mois : G(6) = Janvier(1) → 5 + pMois
      cMont = parseFloat(cr[5 + pMois]) || 0;
    } else if (pTri) {
      var starts = {1:0, 2:3, 3:6, 4:9};
      var base   = starts[pTri];
      for (var k = 0; k < 3; k++) cMont += parseFloat(cr[6 + base + k]) || 0;
    } else {
      for (var k = 6; k <= 17; k++) cMont += parseFloat(cr[k]) || 0;
    }
    if (!cMont) continue;

    totalConso25 += cMont;
    c25ByCPT[cCpt] = (c25ByCPT[cCpt] || 0) + cMont;
  }

  // ════════════════════════════════
  // 7. CONSTRUCTION DONNÉES GRAPHIQUES
  // ════════════════════════════════

  // Chart par compte comptable (merge budget + conso26 + conso25)
  var allCPTs = {};
  [Object.keys(byCPT), Object.keys(budByCPT), Object.keys(c25ByCPT)].forEach(function(arr) {
    arr.forEach(function(k) { allCPTs[k] = 1; });
  });
  var chartByCPT = Object.keys(allCPTs).map(function(c) {
    var bud = budByCPT[c] || 0;
    var c26 = byCPT[c]    || 0;
    return {
      label  : c,
      budget : Math.round(bud),
      conso26: Math.round(c26),
      conso25: Math.round(c25ByCPT[c] || 0),
      pct    : bud > 0 ? Math.round(c26 / bud * 100) : 0,
    };
  }).sort(function(a,b){ return b.budget - a.budget; }).slice(0, 25);

  // Chart par sous-famille
  var allSFs = {};
  [Object.keys(bySF), Object.keys(budBySF)].forEach(function(arr) {
    arr.forEach(function(k) { allSFs[k] = 1; });
  });
  var chartBySF = Object.keys(allSFs).map(function(sf) {
    var bud = budBySF[sf] || 0;
    var c26 = bySF[sf]    || 0;
    return {
      label  : sf,
      budget : Math.round(bud),
      conso26: Math.round(c26),
      pct    : bud > 0 ? Math.round(c26 / bud * 100) : 0,
    };
  }).sort(function(a,b){ return b.budget - a.budget; }).slice(0, 20);

  // ════════════════════════════════
  // 8. RETOUR
  // ════════════════════════════════
  var reste = totalBudget - totalEngage;
  var taux  = totalBudget > 0 ? Math.round(totalEngage / totalBudget * 1000) / 10 : 0;

  return {
    kpi: {
      budget  : Math.round(totalBudget),
      engage  : Math.round(totalEngage),
      reste   : Math.round(reste),
      taux    : taux,
      saving  : Math.round(totalSaving),
      delaiBC : dBCn > 0 ? Math.round(dBCsum / dBCn * 10) / 10 : 0,
      delaiDA : dDAn > 0 ? Math.round(dDAsum / dDAn * 10) / 10 : 0,
      nbLignes: rows.length,
    },
    comparatif: {
      budget26: Math.round(totalBudget),
      conso26 : Math.round(totalEngage),
      conso25 : Math.round(totalConso25),
    },
    chartByCPT,
    chartBySF,
    filterOptions,
  };
}
/**
 * PATCH getAchatData() — Ajouter DATA_SAGE
 * 
 * INSTRUCTIONS :
 * 1. Ouvre Code.gs
 * 2. Cherche "function getAchatData()"
 * 3. Remplace TOUT le bloc (de "function getAchatData() {" jusqu'au "}" avant "function getAchatConsoData")
 * 4. Colle ce qui suit :
 */

function getAchatData() {
  const result = {
    data: [],
    headers: [],
    budget: [],
    budgetHeaders: [],
    consoN1: [],
    dataSage: [],     // ← NOUVEAU
    lastUpdate: "--/--/----"
  };
  
  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    
    // --- BDD_CND_APP ---
    const sheetAchat = ss.getSheetByName("BDD_CND_APP");
    if (sheetAchat) {
      const lastRow = sheetAchat.getLastRow();
      const lastCol = sheetAchat.getLastColumn();
      if (lastRow >= 3 && lastCol >= 1) {
        const rawHeaders = sheetAchat.getRange(2, 1, 1, lastCol).getValues()[0];
        const rawData    = sheetAchat.getRange(3, 1, lastRow - 2, lastCol).getValues();
        result.headers = rawHeaders.map(h => String(h || ""));
        result.data = rawData.map(row => row.map(cell => {
          if (cell instanceof Date) {
            const d  = cell.getDate().toString().padStart(2, '0');
            const m  = (cell.getMonth() + 1).toString().padStart(2, '0');
            const y  = cell.getFullYear();
            const h  = cell.getHours().toString().padStart(2, '0');
            const mn = cell.getMinutes().toString().padStart(2, '0');
            return d + '/' + m + '/' + y + ' ' + h + ':' + mn;
          }
          if (cell === null || cell === undefined) return "";
          return cell;
        }));
      }
    }
    
    // --- Index_buget ---
    const sheetBudget = ss.getSheetByName("Index_buget");
    if (sheetBudget) {
      const lastRowB = sheetBudget.getLastRow();
      const lastColB = sheetBudget.getLastColumn();
      if (lastRowB >= 2 && lastColB >= 1) {
        const rawHeadersB = sheetBudget.getRange(1, 1, 1, lastColB).getValues()[0];
        const rawBudget   = sheetBudget.getRange(2, 1, lastRowB - 1, lastColB).getValues();
        result.budgetHeaders = rawHeadersB.map(h => String(h || ""));
        result.budget = rawBudget.map(row => row.map(cell => {
          if (cell instanceof Date) {
            const d = cell.getDate().toString().padStart(2, '0');
            const m = (cell.getMonth() + 1).toString().padStart(2, '0');
            const y = cell.getFullYear();
            return d + '/' + m + '/' + y;
          }
          if (cell === null || cell === undefined) return "";
          return cell;
        }));
      }
    }

    // --- index_6_2025 (conso N-1) ---
    const sheetN1 = ss.getSheetByName("index_6_2025");
    if (sheetN1) {
      const lastRowN1 = sheetN1.getLastRow();
      const lastColN1 = sheetN1.getLastColumn();
      if (lastRowN1 >= 2 && lastColN1 >= 1) {
        result.consoN1 = sheetN1
          .getRange(2, 1, lastRowN1 - 1, Math.min(lastColN1, 18))
          .getValues()
          .map(row => row.map(cell => (cell === null || cell === undefined) ? "" : cell));
      }
      Logger.log("✅ index_6_2025 : " + result.consoN1.length + " lignes");
    }

    // --- DATA_SAGE (NOUVEAU) ---
    const sheetSage = ss.getSheetByName("DATA_SAGE");
    if (sheetSage) {
      const lastRowS = sheetSage.getLastRow();
      const lastColS = sheetSage.getLastColumn();
      if (lastRowS >= 2 && lastColS >= 1) {
        result.dataSage = sheetSage
          .getRange(2, 1, lastRowS - 1, Math.min(lastColS, 18))
          .getValues()
          .map(row => row.map(cell => {
            if (cell instanceof Date) {
              var d = cell.getDate().toString().padStart(2, '0');
              var m = (cell.getMonth() + 1).toString().padStart(2, '0');
              var y = cell.getFullYear();
              return d + '/' + m + '/' + y;
            }
            if (cell === null || cell === undefined) return "";
            return cell;
          }));
      }
      Logger.log("✅ DATA_SAGE : " + result.dataSage.length + " lignes");
    } else {
      Logger.log("⚠️ DATA_SAGE introuvable");
    }

    const prop = PropertiesService.getScriptProperties().getProperty('LAST_ACHAT_UPDATE');
    if (prop) result.lastUpdate = prop;
    
  } catch(e) {
    Logger.log("Erreur getAchatData : " + e.message + "\n" + e.stack);
  }
  
  return result;
}
/**
 * getAchatData v16 - AKDITAL Manager Suite
 * Lit : BDD_CND_APP, BDD_CND_APP_2025, Index_buget, index_6_2025, DATA_SAGE
 */
function getAchatData() {
  const result = {
    data: [], headers: [],
    data2025: [], headers2025: [],
    budget: [], budgetHeaders: [],
    consoN1: [],
    dataSage: [],
    lastUpdate: "--/--/----"
  };

  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);

    // Helper générique
    function readSheet(name, headerRow, dataStartRow) {
      const sheet = ss.getSheetByName(name);
      if (!sheet) { Logger.log("⚠️ Feuille introuvable : " + name); return null; }
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      if (lastRow < dataStartRow || lastCol < 1) return null;
      const headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0].map(h => String(h || ""));
      const data = sheet.getRange(dataStartRow, 1, lastRow - dataStartRow + 1, lastCol).getValues().map(row =>
        row.map(cell => {
          if (cell instanceof Date) {
            const d = cell.getDate().toString().padStart(2, '0');
            const m = (cell.getMonth() + 1).toString().padStart(2, '0');
            const y = cell.getFullYear();
            const h = cell.getHours().toString().padStart(2, '0');
            const mn = cell.getMinutes().toString().padStart(2, '0');
            return (h === '00' && mn === '00') ? `${d}/${m}/${y}` : `${d}/${m}/${y} ${h}:${mn}`;
          }
          if (cell === null || cell === undefined) return "";
          return cell;
        })
      );
      Logger.log("✅ " + name + " : " + data.length + " lignes");
      return { headers, data };
    }

    // BDD_CND_APP (headers ligne 2, data ligne 3+)
    const bdd = readSheet("BDD_CND_APP", 2, 3);
    if (bdd) { result.headers = bdd.headers; result.data = bdd.data; }

    // BDD_CND_APP_2025 (même structure que BDD_CND_APP)
    const bdd25 = readSheet("BDD_CND_APP_2025", 2, 3);
    if (bdd25) { result.headers2025 = bdd25.headers; result.data2025 = bdd25.data; }

    // Index_buget (headers ligne 1, data ligne 2+)
    const bud = readSheet("Index_buget", 1, 2);
    if (bud) { result.budgetHeaders = bud.headers; result.budget = bud.data; }

    // index_6_2025 (conso N-1 pivot 12 mois)
    const n1 = readSheet("index_6_2025", 1, 2);
    if (n1) result.consoN1 = n1.data;

    // DATA_SAGE
    const sage = readSheet("DATA_SAGE", 1, 2);
    if (sage) result.dataSage = sage.data;

    const prop = PropertiesService.getScriptProperties().getProperty('LAST_ACHAT_UPDATE');
    if (prop) result.lastUpdate = prop;

  } catch (e) {
    Logger.log("Erreur getAchatData : " + e.message + "\n" + e.stack);
  }

  return result;
}
/**
 * getAchatData v17 — AKDITAL Manager Suite
 * Lit : BDD_CND_APP, BDD_CND_APP_2025, Index_buget, Index_buget_APP, index_6_2025, DATA_SAGE, Code_article
 */
function getAchatData() {
  var result = {
    data: [], headers: [],
    data2025: [], headers2025: [],
    budget: [], budgetHeaders: [],
    budgetApp: [],
    consoN1: [],
    dataSage: [],
    codeArticle: [],
    lastUpdate: "--/--/----"
  };

  try {
    var ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);

    function readSheet(name, headerRow, dataStartRow, maxCol) {
      var sheet = ss.getSheetByName(name);
      if (!sheet) { Logger.log("⚠️ Feuille introuvable : " + name); return null; }
      var lastRow = sheet.getLastRow();
      var lastCol = maxCol || sheet.getLastColumn();
      if (lastRow < dataStartRow || lastCol < 1) return null;
      var headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0].map(function(h){return String(h || "");});
      var data = sheet.getRange(dataStartRow, 1, lastRow - dataStartRow + 1, lastCol).getValues().map(function(row) {
        return row.map(function(cell) {
          if (cell instanceof Date) {
            var d = cell.getDate().toString().padStart(2, '0');
            var m = (cell.getMonth() + 1).toString().padStart(2, '0');
            var y = cell.getFullYear();
            var h = cell.getHours().toString().padStart(2, '0');
            var mn = cell.getMinutes().toString().padStart(2, '0');
            return (h === '00' && mn === '00') ? d+'/'+m+'/'+y : d+'/'+m+'/'+y+' '+h+':'+mn;
          }
          if (cell === null || cell === undefined) return "";
          return cell;
        });
      });
      Logger.log("✅ " + name + " : " + data.length + " lignes");
      return { headers: headers, data: data };
    }

    var bdd = readSheet("BDD_CND_APP", 2, 3);
    if (bdd) { result.headers = bdd.headers; result.data = bdd.data; }

    var bdd25 = readSheet("BDD_CND_APP_2025", 2, 3);
    if (bdd25) { result.headers2025 = bdd25.headers; result.data2025 = bdd25.data; }

    var bud = readSheet("Index_buget", 1, 2);
    if (bud) { result.budgetHeaders = bud.headers; result.budget = bud.data; }

    var budApp = readSheet("Index_buget_APP", 1, 2);
    if (budApp) result.budgetApp = budApp.data;

    var n1 = readSheet("index_6_2025", 1, 2, 18);
    if (n1) result.consoN1 = n1.data;

    var sage = readSheet("DATA_SAGE", 1, 2);
    if (sage) result.dataSage = sage.data;

    var art = readSheet("Code_article", 1, 2);
    if (art) result.codeArticle = art.data;

    var prop = PropertiesService.getScriptProperties().getProperty('LAST_ACHAT_UPDATE');
    if (prop) result.lastUpdate = prop;

  } catch(e) {
    Logger.log("Erreur getAchatData : " + e.message + "\n" + e.stack);
  }

  return result;
}
const SECURITY_DB_ID = '1EImVCSXRLHK6X4agSFguvctgUtiwgO519VBHZtaMod8';
function getSecurityDb() { return SpreadsheetApp.openById(SECURITY_DB_ID); }

function getUserContext() {
  var email = Session.getActiveUser().getEmail().toLowerCase();
  var data  = getSecurityDb().getSheetByName('Users').getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).toLowerCase() === email)
      return { email:email, hasAccess:true, role:data[i][3], entity:data[i][4], poste:data[i][5]||'', photo:data[i][6]||'' };
  }
  return { email:email, hasAccess:false, role:'NONE', entity:'NONE', poste:'', photo:'' };
}

function verifyCustomLogin(username, password, clientIp) {
  var userSheet = getSecurityDb().getSheetByName('Users');
  var logSheet  = getSecurityDb().getSheetByName('Logs_ESG');
  var data = userSheet.getDataRange().getValues();
  username = String(username).trim().toLowerCase();
  var user = null;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === username) {
      user = { pass:data[i][1], email:String(data[i][2]).toLowerCase(), role:data[i][3], entity:data[i][4], poste:data[i][5]||'', photo:data[i][6]||'' };
      break;
    }
  }
  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  if (!user) { logSheet.appendRow([now, username, clientIp, 'FAIL', 'LOGIN', 'Utilisateur non trouvé']); return { success:false, message:'Identifiant ou mot de passe incorrect' }; }
  if (String(user.pass) !== String(password)) { logSheet.appendRow([now, username, clientIp, 'FAIL', 'LOGIN', 'Mot de passe incorrect']); return { success:false, message:'Identifiant ou mot de passe incorrect' }; }
  logSheet.appendRow([now, username, clientIp, 'SUCCESS', 'LOGIN', 'Connexion réussie']);
  return { success:true, username:username, email:user.email, role:user.role, entity:user.entity, poste:user.poste, photo:user.photo };
}

function resetUserPassword(email) {
  var data = getSecurityDb().getSheetByName('Users').getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).toLowerCase() === email.toLowerCase()) {
      GmailApp.sendEmail(email, 'AKDITAL - Réinitialisation mot de passe', 'Contactez votre administrateur pour réinitialiser votre mot de passe.');
      return { success:true, message:'Email envoyé. Vérifiez votre boîte de réception.' };
    }
  }
  return { success:false, message:'Email non trouvé.' };
}

function changeUserPassword(username, oldPass, newPass, clientIp) {
  var sheet = getSecurityDb().getSheetByName('Users');
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === username.toLowerCase()) {
      if (String(data[i][1]) !== String(oldPass)) return { success:false, message:'Ancien mot de passe incorrect' };
      sheet.getRange(i+1, 2).setValue(newPass);
      return { success:true, message:'Mot de passe modifié.' };
    }
  }
  return { success:false, message:'Utilisateur non trouvé.' };
}