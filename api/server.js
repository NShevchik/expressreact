const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const { default: axios } = require('axios')
const bodyParser = require('body-parser');
const { OAuth2Client } = require('google-auth-library')
const jwt = require('jsonwebtoken')
const { default: jsPDF } = require('jspdf')
const companyDomain = 'softteco.com'
// const passport = require('passport')
// const session = require('express-session')
// const GoogleStrategy = require('passport-google-oauth20').Strategy
const autoTable = require('jspdf-autotable')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({
  origin: ['http://localhost:3000'],
  methods: "GET,POST,PUT,DELETE,OPTIONS"
}))
app.get('/api', (req, res) => {
  res.json({ "users": ["user1", "user2", "user3"] })
})

const GOOGLE_CLIENT_ID = '1084790864810-i4ik45g29hsubr09c28u4f7sv7bvmomm.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    return { payload: ticket.getPayload() };
  } catch (error) {
    return { error: "Invalid user detected. Please try again" };
  }
}

app.post("/login", async (req, res) => {
  try {
    if (req.body.credential) {
      const verificationResponse = await verifyGoogleToken(req.body.credential);
      if (verificationResponse.error) {
        return res.status(400).json({
          message: verificationResponse.error,
        });
      }
      const profile = verificationResponse?.payload;

      if (profile.hd !== companyDomain) {
        return res.status(400).json({
          message: "You are not softteco user. Please sign up",
        });
      }

      res.status(201).json({
        message: "Login was successful",
        user: {
          firstName: profile?.given_name,
          lastName: profile?.family_name,
          picture: profile?.picture,
          email: profile?.email,
          token: jwt.sign({ email: profile?.email }, 'mySecret', {
            expiresIn: "1d",
          }),
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error?.message || error,
    });
  }
});

app.post(`/check`, (req, res) => {
  const url = encodeURIComponent(req.body.url);
  console.log('url +')
  function checkSslStatus() {
    console.log('check function ssl')
    return new Promise((resolve, reject) => {
      axios.get(`https://api.ssllabs.com/api/v3/analyze?host=${url}&all=on`)
        .then(result => {
          console.log(result.data.status)
          if (result.data.status === 'DNS') {
            setTimeout(() => {
              resolve(checkSslStatus());
            }, 5000);
          } else if (result.data.status === 'IN_PROGRESS') {
            setTimeout(() => {
              resolve(checkSslStatus());
            }, 10000);
          } else if (result.data.status === 'READY') {
            resolve(result.data);
          }
        })
        .catch(error => {
          console.log(error)
          reject(error);
        });
    });
  }
  axios.get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${process.env['GOOGLE_API_KEY']}`)
    .then(resultGoogle => { console.log('res googl'); return resultGoogle.data })
    .then(resultGoogle => {
      const googleObject = resultGoogle;
      console.log('googleObject +')
      return checkSslStatus()
        .then(resultSsl => {
          console.log('resultSSL +')
          const doc = buildPdf(res, googleObject, resultSsl);
          console.log('doc +')
          res.send(doc.output());
        });
    })
    .catch(error => {
      console.log(error.response)
      res.status(400).send(new Error(error.code));
    });
  // axios.get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${process.env['GOOGLE_API_KEY']}`)
  //   .then(resultGoogle => { console.log(resultGoogle.data); return resultGoogle.data })
  //   .then(resultGoogle => {
  //     const googleObject = resultGoogle;
  //     const dataFromSsl = new Promise((resolve, reject) => {
  //       axios.get(`https://api.ssllabs.com/api/v3/analyze?host=${url}&all=on`).then(result => { resolve(result.data) })
  //     })
  //     dataFromSsl.then(result => {
  //       if (result.status === 'DNS') {

  //       } else if (result.status === 'IN_PROGRESS') {

  //       } else if (result.status === 'READY') {
  //         const doc = buildPdf(googleObject, result)
  //         res.send(doc.output());
  //       }
  //     })
  //   })
  //   .catch((error) => { res.status(400).send(new Error(error.code)) })
})

const gradesExplain = {
  'T': `Certificate hostnames don't match the site hostname`,
  'F': `Certificate has been revoked. Use of CBC ciphers with TLS 1.2 or below. This grades indicate that the SSL/TLS configuration is very weak and may be easily compromised.`,
  'C': `Use of legacy 64-bit block ciphers. Use of ciphers that theoretically support forward secrecy. Grade indicate that the SSL/TLS configuration is weak and may be vulnerable to attacks.`,
  'B': `Server does not support forward secrecy. Grade indicate that the SSL/TLS configuration is weak and may be vulnerable to attacks.`,
  'A+': `This is the highest grade, and it indicates that the SSL/TLS configuration is exceptional and meets the most stringent security standards.`,
  'A-': `This grade indicate that the SSL/TLS configuration is strong and secure, but there may be some room for improvement.`,
  'A': `This grade indicate that the SSL/TLS configuration is strong and secure, but there may be some room for improvement.`,
  'D': `This grades indicate that the SSL/TLS configuration is very weak and may be easily compromised.`,
  'E': `This grades indicate that the SSL/TLS configuration is very weak and may be easily compromised.`,
}

function isCertificateValid(sertificateDate) {
  const today = new Date()
  const sertificateExpire = new Date(sertificateDate)
  return sertificateExpire > today
}

function buildPdf(res, googleObject, sslObject) {
  const doc = new jsPDF({
    orientation: 'l',
    putOnlyUsedFonts: true
  });
  console.log('doc in jsPDF +')
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const siteIp = sslObject.endpoints[0].ipAddress
  const overallGrade = sslObject.endpoints[0].grade
  const sslProtocols = sslObject.endpoints[0].details.protocols
  const testDuration = sslObject.endpoints[0].duration
  const serverSignature = sslObject.endpoints[0].details.serverSignature
  const securityHeaders = sslObject.endpoints[0].details.httpTransactions[0].responseHeaders
  const certificates = sslObject.certs
  console.log('all consts in jsPDF +')
  doc.text('Page Report', 14, 20);
  doc.text(`Report: ${googleObject.lighthouseResult.finalUrl}`, 14, 30);
  doc.setTextColor('#C1C1C1')
  doc.setFontSize(10);
  doc.text(`(${siteIp})`, 14, 35);
  doc.setFontSize(14);
  doc.setTextColor('#00000')
  doc.text('Overall Rating', 14, 45)
  doc.setFontSize(32);
  if (overallGrade === undefined) {
    doc.text(`Ungraded`, 50, 46.5)
  } else if (overallGrade?.includes('A')) {
    doc.setTextColor('#B0FF92')
    doc.text(`${overallGrade}`, 50, 46.5)
  } else if (overallGrade === 'B') {
    doc.setTextColor('#F9DC5C')
    doc.text(`${overallGrade}`, 50, 46.5)
  } else {
    doc.setTextColor('#FE5F00')
    doc.text(`${overallGrade}`, 50, 46.5)
  }
  console.log('some text 1 +')
  doc.setFontSize(12);
  doc.setTextColor('#00000')
  console.log('some text 1.2 +')
  const splitText = doc.splitTextToSize(`${gradesExplain[overallGrade]}`, 250)
  console.log('some text 1.2.1 +')
  doc.text(splitText, 14, 55)
  doc.setFontSize(14);
  console.log('some text 1.3 +')
  doc.text('Page protocols', 14, 80)
  const tableDataSSL = [];
  for (let protocol of sslProtocols) {
    tableDataSSL.push([protocol.name, protocol.version])
  }
  console.log('some text 1.4 +')
  doc.autoTable({
    startY: 85,
    head: [['Name', 'Version']],
    body: tableDataSSL,
    columnStyles: {
      0: { cellWidth: 50 },
      1: { halign: 'center', cellWidth: 20 }
    },
  })
  console.log('some text 2 +')
  doc.autoTable({
    head: [['Miscellaneous parameters', 'Value']],
    body: [['HTTP server signature', serverSignature], ['Test duration	', `${(testDuration / 1000).toFixed(1)}s`]],
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 50 }
    }
  })
  const tableHeaders = []
  for (let header of securityHeaders) {
    tableHeaders.push([header.name, header.value])
  }
  doc.autoTable({
    head: [['Header name', 'Value']],
    body: tableHeaders,
  })
  console.log('tables +')
  const tableCertificates = []
  for (let certificate of certificates) {
    let styleColor;
    if (isCertificateValid(certificate.notAfter)) {
      styleColor = [0, 175, 84]
    } else {
      styleColor = [255, 0, 60]
    }
    tableCertificates.push([certificate.commonNames.join(', '), { content: `${(new Date(certificate.notAfter)).toLocaleDateString()}`, styles: { textColor: styleColor } }, certificate.subject])
  }
  doc.autoTable({
    head: [['Certificate Name(s)', 'Expired At', 'Subject']],
    body: tableCertificates
  })
  doc.addPage()
  doc.text('Recomendations from Page Speed Insights API', 14, 20)
  const tableDataGoogle = [];
  for (let metric in googleObject.lighthouseResult.audits) {
    if (googleObject.lighthouseResult.audits[metric].score) {
      tableDataGoogle.push([googleObject.lighthouseResult.audits[metric].title, replaceInvisibleCharacter(googleObject.lighthouseResult.audits[metric].displayValue), googleObject.lighthouseResult.audits[metric].description]);
    }
  }
  console.log('some text 3 +')
  doc.autoTable({
    startY: 30,
    head: [['Metric', 'Value', 'Description']],
    body: tableDataGoogle,
    columnStyles: {
      0: { cellWidth: 30 },
      1: { halign: 'center', fillColor: [232, 255, 255], cellWidth: 30 }
    },
  })
  console.log('all text and data in jsPDF +')
  res.setHeader('Content-Type', 'application/pdf');
  console.log('1st header +')
  res.setHeader('Content-Disposition', 'attachment; filename=pagespeed_report.pdf');
  console.log('2nd header +')
  return doc
}

app.get('/pdf', (req, res) => {
  const doc = buildTestPdf(res);
  res.send(doc.output());
});

function buildTestPdf(res) {
  const doc = new jsPDF()
  doc.text('TEST PDF FROM API', 14, 20);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=pagespeed_report.pdf');
  return doc;
}


function replaceInvisibleCharacter(str) {
  if (str) {
    return str.replace(/\u00a0/g, ' ');
  }
  else {
    return str
  }
}


app.listen(5000, () => { console.log('Server started on port 5000') })



// const dataFromSsl = new Promise((resolve, reject) => {
//   axios.get(`https://api.ssllabs.com/api/v3/analyze?host=${url}&all=on`).then(result => { resolve(result.data) })
// })
// dataFromSsl.then(result => {
//   console.log(result.status);
//   if (result.status === 'DNS') {
//     res.redirect(`/analyze&host=${url}`)
//   } else if (result.status === 'IN_PROGRESS') {
//     console.log('Analyzin in progress... (up to 2 minutes)')
//     setTimeout(() => res.redirect(`/analyze&host=${url}`), 3000)
//   } else if (result.status === 'READY') {
//     const idSsl = randomUUID()
//     results[idSsl] = result;
//     axios.get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${process.env['GOOGLE_API_KEY']}`)
//       .then(resultGoogle => resultGoogle.data)
//       .then(resultGoogle => { const idGoogle = randomUUID(); results[idGoogle] = resultGoogle; res.redirect(`/result&ids=${idSsl}_sslgoogle_${idGoogle}`) })
//   }
// })

// app.use(session({
//   secret: 'secret-key',
//   resave: false,
//   saveUninitialized: true
// }))
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(passport.initialize());
// app.use(passport.session());

// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: '/auth/google/callback',
//   userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
// }, function (accessToken, refreshToken, profile, done) {
//   const userEmail = profile._json.email
//   const userEmailDomain = userEmail.split('@')[1];
//   if (userEmailDomain === 'softteco.com') {
//     return done(null, profile);
//   } else {
//     return done(null, false, { message: 'You are not authorized to use this app.' });
//   }
// }));

// passport.serializeUser(function (profile, done) {
//   done(null, profile);
// });
// passport.deserializeUser(function (profile, done) {
//   done(null, profile);
// });

// // app.get('/login', (req, res) => {
// //   res.send(`<a href="/auth/google">Log in Google Account</a>`)
// // })
// app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// app.get('/auth/google/callback', passport.authenticate('google', {
//   successRedirect: '/check',
//   failureRedirect: '/deny'
// }));

// app.get('/check', (req, res) => {
//   if (req.user?._json?.hd === 'softteco.com') {
//     res.send(`
//     <div>Welcome, ${req.user.displayName}</div>
//     <div>${req.user.emails[0].value}</div>
//       <form action='/analyze' method='POST'>
//         <input type="text" id="url" name="url">
//         <button type="submit">Check site</button>
//       </form>
//     `);
//   } else {
//     res.send(`<div>Access denied for not Soffteco users</div><br><a href="/login">Log in</a>`)
//   }
// });

// // app.post('/analyze', (req, res) => {
// //   const url = encodeURIComponent(req.body.url);
// //   const dataFromSsl = new Promise((resolve, reject) => {
// //     axios.get(`https://api.ssllabs.com/api/v3/analyze?host=${url}&all=on`).then(result => { resolve(result.data) })
// //   })
// //   dataFromSsl.then(result => {
// //     console.log(result.status);
// //     if (result.status === 'DNS') {
// //       res.redirect(`/analyze&host=${url}`)
// //     } else if (result.status === 'IN_PROGRESS') {
// //       console.log('Analyzin in progress... (up to 2 minutes)')
// //       setTimeout(() => res.redirect(`/analyze&host=${url}`), 3000)
// //     } else if (result.status === 'READY') {
// //       const idSsl = randomUUID()
// //       results[idSsl] = result;
// //       axios.get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${process.env['GOOGLE_API_KEY']}`)
// //         .then(resultGoogle => resultGoogle.data)
// //         .then(resultGoogle => { const idGoogle = randomUUID(); results[idGoogle] = resultGoogle; res.redirect(`/result&ids=${idSsl}_sslgoogle_${idGoogle}`) })
// //     }
// //   })
// // })

// // app.get('/testgoogle', (req, res) => {
// //   const url = 'https://softtstatics.softteco.comeco.co/'
// //   axios.get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=AIzaSyCM0bynHSEdEC9l09CW8eCUAsjMWWgbDDc`)
// //     .then(result => { console.log(result.data) })
// // })

// app.get('/result&ids=:ids', (req, res) => {
//   const ids = req.params.ids;
//   console.log(ids)
//   const idSsl = ids.split('_sslgoogle_')[0]
//   const idGoogle = ids.split('_sslgoogle_')[1]
//   const resultSsl = results[idSsl];
//   const resultGoogle = results[idGoogle]
//   // console.log('idSsl ', idSsl)
//   // console.log(results[idSsl])
//   // console.log('results ', results)
//   // console.log(resultSsl);
//   // console.log(resultGoogle)
//   buildPdf(res, resultGoogle, resultSsl)
// })

// app.get('/deny', (req, res) => {
//   res.send('You are not authorized to use this app.');
// });
// // res.send(`${result.status}`)

// function buildPdf(res, googleObject, sslObject) {
// const doc = new jsPDF({
//   orientation: 'l',
//   putOnlyUsedFonts: true
// });
// doc.setFontSize(14);
// doc.setFont('helvetica', 'bold');

// const siteIp = sslObject.endpoints[0].ipAddress
// const overallGrade = sslObject.endpoints[0].grade
// const sslProtocols = sslObject.endpoints[0].details.protocols
// const testDuration = sslObject.endpoints[0].duration
// const serverSignature = sslObject.endpoints[0].details.serverSignature
// const securityHeaders = sslObject.endpoints[0].details.httpTransactions[0].responseHeaders
// const certificates = sslObject.certs

// doc.text('Page Report', 14, 20);

// doc.text(`Report: ${googleObject.lighthouseResult.finalUrl}`, 14, 30);
// doc.setTextColor('#C1C1C1')
// doc.setFontSize(10);
// doc.text(`(${siteIp})`, 14, 35);
// doc.setFontSize(14);
// doc.setTextColor('#00000')
// doc.text('Overall Rating', 14, 45)
// doc.setFontSize(32);
// if (overallGrade === undefined) {
//   doc.text(`Ungraded`, 50, 46.5)
// } else if (overallGrade?.includes('A')) {
//   doc.setTextColor('#B0FF92')
//   doc.text(`${overallGrade}`, 50, 46.5)
// } else if (overallGrade === 'B') {
//   doc.setTextColor('#F9DC5C')
//   doc.text(`${overallGrade}`, 50, 46.5)
// } else {
//   doc.setTextColor('#FE5F00')
//   doc.text(`${overallGrade}`, 50, 46.5)
// }
// doc.setFontSize(12);
// doc.setTextColor('#00000')
// const splitText = doc.splitTextToSize(`${gradesExplain[overallGrade]}`, 250)
// doc.text(splitText, 14, 55)
// doc.setFontSize(14);
// doc.text('Page protocols', 14, 80)
// const tableDataSSL = [];
// for (let protocol of sslProtocols) {
//   tableDataSSL.push([protocol.name, protocol.version])
// }
// doc.autoTable({
//   startY: 85,
//   head: [['Name', 'Version']],
//   body: tableDataSSL,
//   columnStyles: {
//     0: { cellWidth: 50 },
//     1: { halign: 'center', cellWidth: 20 }
//   },
// })
// doc.autoTable({
//   head: [['Miscellaneous parameters', 'Value']],
//   body: [['HTTP server signature', serverSignature], ['Test duration	', `${(testDuration / 1000).toFixed(1)}s`]],
//   columnStyles: {
//     0: { cellWidth: 50 },
//     1: { cellWidth: 50 }
//   }
// })
// const tableHeaders = []
// for (let header of securityHeaders) {
//   tableHeaders.push([header.name, header.value])
// }
// doc.autoTable({
//   head: [['Header name', 'Value']],
//   body: tableHeaders,
// })
// const tableCertificates = []
// for (let certificate of certificates) {
//   let styleColor;
//   if (isCertificateValid(certificate.notAfter)) {
//     styleColor = [0, 175, 84]
//   } else {
//     styleColor = [255, 0, 60]
//   }
//   tableCertificates.push([certificate.commonNames.join(', '), { content: `${(new Date(certificate.notAfter)).toLocaleDateString()}`, styles: { textColor: styleColor } }, certificate.subject])
// }
// doc.autoTable({
//   head: [['Certificate Name(s)', 'Expired At', 'Subject']],
//   body: tableCertificates
// })
// doc.addPage()
// doc.text('Recomendations from Page Speed Insights API', 14, 20)
// const tableDataGoogle = [];
// for (let metric in googleObject.lighthouseResult.audits) {
//   if (googleObject.lighthouseResult.audits[metric].score) {
//     tableDataGoogle.push([googleObject.lighthouseResult.audits[metric].title, replaceInvisibleCharacter(googleObject.lighthouseResult.audits[metric].displayValue), googleObject.lighthouseResult.audits[metric].description]);
//   }
// }
// doc.autoTable({
//   startY: 30,
//   head: [['Metric', 'Value', 'Description']],
//   body: tableDataGoogle,
//   columnStyles: {
//     0: { cellWidth: 30 },
//     1: { halign: 'center', fillColor: [232, 255, 255], cellWidth: 30 }
//   },
// })

//   // doc.save('pagespeed_report.pdf');
//   res.setHeader('Content-Type', 'application/pdf');
//   res.setHeader('Content-Disposition', 'attachment; filename=pagespeed_report.pdf');
//   res.send(doc.output());
// }

// app.get('/pdf', (req, res) => {
//   buildPdf(res);
// });