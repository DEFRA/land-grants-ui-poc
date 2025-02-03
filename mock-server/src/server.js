const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/geodata', (req, res) => {
    res.json({
        success: true,
        message: "Grants MOC UI",
        data: {
            parcelId: "669ff70f-61df-4a75-b7dd-457b933b777c",
            geo: "[102.0, 0.5]"
        }
    });
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
