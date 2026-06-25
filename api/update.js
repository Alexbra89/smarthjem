// api/update.js
const fs = require('fs');
const path = require('path');

// Hjelpefunksjon for å lese data.json
function readData() {
  try {
    const filePath = path.join(process.cwd(), 'data.json');
    const rawData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Feil ved lesing av data.json:', error);
    // Returner standard data hvis filen ikke finnes
    return {
      handleliste: [],
      notater: {},
      soppeltomming: [],
      datonotater: {},
      egneHendelser: [],
      innstillinger: {}
    };
  }
}

// Hjelpefunksjon for å skrive til data.json
function writeData(data) {
  try {
    const filePath = path.join(process.cwd(), 'data.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Feil ved skriving til data.json:', error);
    return false;
  }
}

module.exports = async (req, res) => {
  // Aktiver CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Håndter OPTIONS (preflight) forespørsler
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Kun POST er tillatt for oppdatering
  if (req.method === 'POST') {
    try {
      const body = req.body;
      
      // Valider at vi har nødvendig data
      if (!body || !body.type) {
        return res.status(400).json({ 
          success: false, 
          error: 'Mangler type i forespørselen' 
        });
      }

      let currentData = readData();
      
      // Oppdater spesifikk type data
      switch (body.type) {
        case 'handleliste':
          if (!Array.isArray(body.data)) {
            return res.status(400).json({ 
              success: false, 
              error: 'Handleliste må være en array' 
            });
          }
          currentData.handleliste = body.data;
          break;
          
        case 'notater':
          currentData.notater = body.data;
          break;
          
        case 'soppeltomming':
          if (!Array.isArray(body.data)) {
            return res.status(400).json({ 
              success: false, 
              error: 'Søppeltømming må være en array' 
            });
          }
          currentData.soppeltomming = body.data;
          break;
          
        case 'datonotater':
          currentData.datonotater = body.data;
          break;
          
        case 'egneHendelser':
          if (!Array.isArray(body.data)) {
            return res.status(400).json({ 
              success: false, 
              error: 'Egne hendelser må være en array' 
            });
          }
          currentData.egneHendelser = body.data;
          break;
          
        case 'innstillinger':
          currentData.innstillinger = body.data;
          break;
          
        case 'initialize':
          // Fullstendig overskriving av data.json
          currentData = body.data;
          break;
          
        case 'leggTilVare':
          // Spesialhåndtering for å legge til en enkelt vare
          if (!body.data || !body.data.tekst) {
            return res.status(400).json({ 
              success: false, 
              error: 'Varen må ha en tekst-egenskap' 
            });
          }
          
          const nyVare = {
            id: Date.now().toString(),
            tekst: body.data.tekst,
            checked: false,
            opprettet: new Date().toISOString()
          };
          
          currentData.handleliste.push(nyVare);
          break;
          
        default:
          return res.status(400).json({ 
            success: false, 
            error: `Ukjent type: ${body.type}` 
          });
      }
      
      // Skriv oppdatert data til fil
      const success = writeData(currentData);
      
      if (success) {
        return res.status(200).json({ 
          success: true, 
          message: `Oppdaterte ${body.type}`,
          data: currentData[body.type] || currentData
        });
      } else {
        return res.status(500).json({ 
          success: false, 
          error: 'Kunne ikke skrive til data.json' 
        });
      }
      
    } catch (error) {
      console.error('API-feil:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Intern serverfeil: ' + error.message 
      });
    }
  }
  
  // Hvis GET, returner data.json
  if (req.method === 'GET') {
    try {
      const data = readData();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Kunne ikke lese data.json' 
      });
    }
  }
  
  // Andre metoder er ikke tillatt
  return res.status(405).json({ 
    success: false, 
    error: 'Kun POST og GET er tillatt' 
  });
};
