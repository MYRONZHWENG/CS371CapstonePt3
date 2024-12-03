"use strict";

(function () {
    window.addEventListener("load", init);//window is the whole webrowser window, make sure you always have this line

    function init() { //initialize function
        document.getElementById("find").addEventListener("click", findRsts); //document indicates the actual html getting loaded
        document.getElementById("restaurant-form").addEventListener("submit", submitRestaurant);
        document.getElementById("delete-form").addEventListener("submit", deleteRestaurant); // Listen for form submit
    }

    function checkStatus(response) {
        if (!response.ok) {
            // Handle different HTTP status codes
            if (response.status === 400) {
                throw new Error("Invalid state code. Please enter a valid 2-character state code.");
            } else if (response.status === 404) {
                throw new Error("No restaurants found for the entered state.");
            } else if (response.status === 500) {
                throw new Error("Server error. Please try again later.");
            } else {
                throw new Error("Error in request: " + response.statusText);
            }
        }
        return response;
    }
    
    function findRsts() { //define what happens when echo-btn is clicked
        const contents = document.getElementById("US-State").value.toUpperCase(); //access an element whose id is w

        if (!contents || contents.length !== 2) {
            document.getElementById("list-of-restaurants").textContent = "Please enter a valid 2-character US state code (e.g., NY).";
            return;
        }

        fetch("state?input=" + contents)
            .then(checkStatus)
            .then(resp => resp.json())
            .then(displayRestaurants)
            .catch(error => {
                // Update the UI with the error message
                document.getElementById("list-of-restaurants").textContent = error.message;
            });
    }

    function displayRestaurants(restaurants) {
        const listElement = document.getElementById("list-of-restaurants");
        listElement.innerHTML = ""; // Clear previous results
        if (restaurants.length === 0) {
            listElement.textContent = "No restaurants found.";
        } else {
            restaurants.forEach(restaurant => {
                const p = document.createElement("p");
                p.textContent = `${restaurant.restaurant_name} - ${restaurant.city}, ${restaurant.state}`;
                listElement.appendChild(p);
            });
        }
    }

    function submitRestaurant(event) {
        event.preventDefault(); // Prevents the form from submitting the default way
        
        // Get the values from the form inputs
        const restaurantData = {
            restaurant_name: document.getElementById("restaurant_name").value,
            city: document.getElementById("city").value,
            state: document.getElementById("state").value,
            address: document.getElementById("address").value,
            description: document.getElementById("description").value,
            cuisine_type: document.getElementById("cuisine_type").value,
            head_chef_or_lead: document.getElementById("head_chef_or_lead").value,
            website: document.getElementById("website").value
        };

        // Send the data to the server using POST
        fetch("/add-restaurant", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(restaurantData)
        })
        .then(response => response.json())
        .then(data => {
            // Handle the response (success or error)
            console.log(data.message);  // Log the response message (success or error)
        })
        .catch(error => {
            console.error("Error:", error);
        });
    }

    function deleteRestaurant(event) {
        event.preventDefault(); // Prevent the form from submitting the default way

        // Get the values from the form inputs
        const state = document.getElementById("delete-state").value.toUpperCase();  // Convert state to uppercase
        const city = document.getElementById("delete-city").value;
        const restaurant_name = document.getElementById("delete-restaurant-name").value;

        // Check if all fields are filled
        if (!state || !city || !restaurant_name) {
            document.getElementById("delete-message").textContent = "All fields must be filled.";
            return;
        }

        // Send DELETE request to the server
        fetch("/delete-restaurant", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ state, city, restaurant_name })
        })
        .then(response => response.json())
        .then(data => {
            // Display success or error message
            document.getElementById("delete-message").textContent = data.message;
        })
        .catch(error => {
            document.getElementById("delete-message").textContent = "Error: " + error.message;
        });
    }
})();