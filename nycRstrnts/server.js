"use strict";

const { Client } = require('pg');
const express = require('express');
const app = express();
app.use(express.json()); //needed for post request
app.use(express.static("public"));
const PORT = 8000;
app.listen(PORT);

const clientConfig = {
    user: 'postgres',
    password: 'mypacepostgresql',
    host: 'my-pace-postgresql.c100weo4yzqv.us-east-2.rds.amazonaws.com',
    port: 5432,
    database: 'nytimes_best_restaurants_2024',
    ssl: {
        rejectUnauthorized: false,
    }
};

app.get('/state', async function (req, res) {
    const code = req.query['enter'];
    if (!code || code.length !== 2) {
        return res.status(400).send("Invalid state code. Please enter a valid 2-character state code.");
    }
    const client = new Client(clientConfig);
    try {
        await client.connect();
        const result = await client.query(
            "SELECT * FROM nytimes_best_restaurants_2024 WHERE state=$1::text", 
            [code]
        );
        if (result.rowCount < 1) {
            res.status(404).send("No restaurants found in the state of ${code}");
        } else {
            res.json(result.rows);
        }
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).send("Internal Server Error");
    } finally {
        await client.end();
    }
});

// POST route to handle restaurant data submission
app.post('/add-restaurant', async function (req, res) {
    const { restaurant_name, city, state, address, description, cuisine_type, head_chef_or_lead, website } = req.body;

    if (!restaurant_name || !city || !state || !address || !description || !cuisine_type || !head_chef_or_lead || !website) {
        return res.status(400).json({ message: "All required fields (restaurant_name, city, state, address) must be filled." });
    }

    const client = new Client(clientConfig);
    try {
        await client.connect();

        // Prepare SQL query to insert new restaurant data
        const result = await client.query(
            `INSERT INTO nytimes_best_restaurants_2024 (restaurant_name, city, state, address, description, cuisine_type, head_chef_or_lead, website)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [restaurant_name, city, state, address, description, cuisine_type, head_chef_or_lead, website]
        );

        // Send success response
        res.json({ message: "Restaurant added successfully!" });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await client.end();
    }
});

// DELETE route to remove a restaurant based on state, city, and name
app.delete('/delete-restaurant', async function (req, res) {
    const { state, city, restaurant_name } = req.body; // Get values from request body

    if (!state || !city || !restaurant_name) {
        return res.status(400).json({ message: "All fields (state, city, restaurant_name) are required." });
    }

    const client = new Client(clientConfig);
    try {
        await client.connect();

        // Prepare SQL query to delete the restaurant by state, city, and name
        const result = await client.query(
            "DELETE FROM nytimes_best_restaurants_2024 WHERE state=$1 AND city=$2 AND restaurant_name=$3 RETURNING *",
            [state, city, restaurant_name]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "No such restaurant found." });
        }

        // Send success response
        res.json({ message: "Restaurant deleted successfully!" });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await client.end();
    }
});