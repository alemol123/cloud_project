pip install azure-data-tables
from azure.data.tables import TableServiceClient
from uuid import uuid4


CONNECTION_STRING = "CONNECTION_STRING_HERE"

AREAS = ["Central", "North", "South"]

MEALS = {
    "Central": {
        "La Plaza Tapas": [
            ("Patatas Bravas", "Crispy fried potatoes served with spicy brava sauce."),
            ("Spanish Omelette", "Traditional tortilla made with eggs, potatoes, and onions."),
            ("Garlic Shrimp", "Sautéed shrimp in garlic and olive oil.")
        ],
        "Sol Street Food": [
            ("Fried Squid Sandwich", "Crispy calamari served in a soft Spanish-style roll."),
            ("Ham Croquettes", "Creamy croquettes filled with Iberian ham."),
            ("Chistorra Sandwich", "Grilled Basque sausage in fresh bread.")
        ],
        "Gran Vía Burger Club": [
            ("Madrid Smash Burger", "Double smashed beef patties with melted cheese."),
            ("Truffle Fries", "Crispy fries topped with truffle oil and parmesan."),
            ("BBQ Bacon Burger", "Beef burger with BBQ sauce and smoked bacon.")
        ],
        "Cava Baja Bodega": [
            ("Broken Eggs with Ham", "Fried potatoes topped with eggs and Iberian ham."),
            ("Russian Salad", "Creamy potato salad with vegetables and tuna."),
            ("Grilled Chorizo Skewers", "Spicy Spanish chorizo grilled on skewers.")
        ],
        "Mercado Central Grill": [
            ("Roasted Chicken with Potatoes", "Oven-roasted chicken served with seasoned potatoes."),
            ("Grilled Lamb Chops", "Juicy lamb chops grilled to perfection."),
            ("Grilled Iberian Pork", "Tender Iberian pork with light seasoning.")
        ],
        "Opera Pizza Bar": [
            ("Barquillo Pizza", "Thin-crust pizza inspired by classic Madrid flavors."),
            ("Four Cheese Pizza", "Mozzarella, gorgonzola, parmesan, and ricotta."),
            ("Pepperoni Pizza", "Classic pepperoni with mozzarella and tomato sauce.")
        ],
        "Retiro Sushi Corner": [
            ("Mixed Sushi (12 pieces)", "Assorted sushi selection including nigiri and maki."),
            ("Salmon Uramaki Rolls", "Inside-out rolls filled with fresh salmon."),
            ("Tuna Sashimi", "Slices of raw tuna served chilled.")
        ],
        "Callao Vegan Kitchen": [
            ("Chickpea Vegan Burger", "Plant-based burger with chickpeas and spices."),
            ("Quinoa & Veggie Bowl", "Fresh quinoa bowl with seasonal vegetables."),
            ("Vegan Lentil Stew", "Hearty lentil stew with Mediterranean herbs.")
        ],
        "Lavapiés Curry House": [
            ("Chicken Tikka Masala", "Marinated chicken in creamy tomato sauce."),
            ("Vegetable Curry", "Mixed vegetables simmered in aromatic spices."),
            ("Lamb Rogan Josh", "Slow-cooked Kashmiri spiced lamb.")
        ],
        "Atocha Pasta & Co": [
            ("Spaghetti Carbonara", "Pasta with creamy egg sauce and pancetta."),
            ("Beef Lasagna", "Layered pasta with beef ragù and béchamel."),
            ("Pesto Tagliatelle", "Tagliatelle tossed in basil pesto sauce.")
        ]
    },

    "North": {
        "Goya Gourmet": [
            ("Grilled Sirloin Steak", "Perfectly grilled sirloin with seasoning."),
            ("Tuna Tartare", "Fresh diced tuna with light citrus dressing."),
            ("Roasted Duck Breast", "Crispy duck breast with reduced sauce.")
        ],
        "Velázquez Sushi & Grill": [
            ("Mixed Nigiri", "Assorted nigiri with fresh fish."),
            ("Seared Tuna Tataki", "Lightly seared tuna with sesame."),
            ("Dragon Roll", "Avocado, eel, and cucumber specialty roll.")
        ],
        "Castellana Burger Lab": [
            ("Castellana Cheese Burger", "Beef burger topped with melted Spanish cheese."),
            ("Sweet Potato Fries", "Crispy sweet potato fries."),
            ("Blue Cheese Burger", "Burger topped with creamy blue cheese.")
        ],
        "Retiro Healthy Bowls": [
            ("Salmon Rice Bowl", "Rice bowl with fresh salmon and veggies."),
            ("Mediterranean Vegan Bowl", "Plant-based bowl with grains and greens."),
            ("Chicken Protein Bowl", "High-protein bowl with grilled chicken.")
        ],
        "Ortega y Gasset Pizza": [
            ("Prosciutto Pizza", "Italian pizza topped with prosciutto."),
            ("Mushroom Pizza", "Pizza with sautéed mushrooms and herbs."),
            ("Truffle Pizza", "Truffle cream base with mozzarella.")
        ],
        "Lista de Tapas": [
            ("Garlic Shrimp", "Classic gambas al ajillo in olive oil."),
            ("Padrón Peppers", "Fried mild peppers with sea salt."),
            ("Spanish Meatballs (Albondigas)", "Meatballs in tomato sauce.")
        ],
        "Serrano Noodle Bar": [
            ("Pork Ramen", "Rich broth ramen with pork belly."),
            ("Vegetable Ramen", "Light ramen with mixed vegetables."),
            ("Spicy Miso Ramen", "Miso ramen with spicy chili paste.")
        ],
        "Diego de León Thai": [
            ("Chicken Pad Thai", "Classic Thai noodles with chicken."),
            ("Red Shrimp Curry", "Shrimp in spicy Thai red curry."),
            ("Thai Fried Rice", "Stir-fried rice with vegetables.")
        ],
        "Salamanca Fusion": [
            ("Pork Belly Bao Bun", "Steamed bun with pork belly."),
            ("Vegetable Stir-Fry", "Mixed vegetables wok-fried."),
            ("Korean Beef Tacos", "Soft tacos with Korean-style beef.")
        ],
        "Alcalá Street Kitchen": [
            ("Ribeye Steak with Fries", "Grilled ribeye with crispy fries."),
            ("Chicken Caesar Salad", "Classic Caesar with grilled chicken."),
            ("Grilled Seabass", "Seabass fillet grilled with lemon.")
        ]
    },

    "South": {
        "Malasaña Street Tacos": [
            ("Slow-Cooked Pork Taco", "Tender pork taco with spices."),
            ("Grilled Chicken Taco", "Chicken taco with fresh toppings."),
            ("Carne Asada Taco", "Beef taco with cilantro and lime.")
        ],
        "Tribunal Burger Joint": [
            ("Malasaña House Burger", "Signature house burger."),
            ("Onion Rings", "Crispy battered onion rings."),
            ("Double Smash Burger", "Double beef patty smash burger.")
        ],
        "Conde Duque Pasta Bar": [
            ("Penne Arrabbiata", "Spicy tomato-based pasta."),
            ("Ricotta Ravioli", "Ravioli stuffed with ricotta cheese."),
            ("Seafood Linguine", "Linguine with mixed seafood.")
        ],
        "Chueca Vegan Bites": [
            ("Falafel Vegan Wrap", "Wrap with falafel and veggies."),
            ("Hummus with Veggies", "Creamy hummus served with vegetables."),
            ("Grilled Vegetable Plate", "Selection of grilled vegetables.")
        ],
        "Fuencarral Ramen House": [
            ("Miso Ramen", "Fermented miso broth ramen."),
            ("Chicken Gyozas", "Japanese dumplings filled with chicken."),
            ("Tonkotsu Ramen", "Pork bone broth ramen.")
        ],
        "San Bernardo Poke": [
            ("Salmon Poke Bowl", "Fresh salmon poke with veggies."),
            ("Tuna Poke Bowl", "Tuna poke bowl with soy dressing."),
            ("Tofu Poke Bowl", "Plant-based tofu poke bowl.")
        ],
        "Noviciado Tap Room": [
            ("Cheese Board", "Selection of Spanish cheeses."),
            ("Iberian Ham Toast", "Toast topped with Iberian ham."),
            ("Marinated Olives & Nuts", "Mixed olives and spiced nuts.")
        ],
        "Pez Curry & Rice": [
            ("Chicken Green Curry", "Thai green curry with chicken."),
            ("Shrimp Fried Rice", "Fried rice with shrimp."),
            ("Beef Vindaloo", "Spicy Indian beef curry.")
        ],
        "Espíritu Santo Pizza": [
            ("Diavola Pizza", "Spicy salami pizza."),
            ("Margherita Pizza", "Classic tomato and mozzarella pizza."),
            ("Prosciutto & Arugula Pizza", "Pizza topped with prosciutto and arugula.")
        ],
        "Manuela Brunch & Coffee": [
            ("Avocado Toast", "Sourdough toast with avocado."),
            ("Fruit Pancakes", "Fluffy pancakes with fruit."),
            ("Eggs Benedict", "Poached eggs on toast with hollandaise.")
        ]
    }
}



def seed_data():

    service = TableServiceClient.from_connection_string(conn_str=CONNECTION_STRING)

    try:
        service.create_table("Meals")
        print("Created table 'Meals'")
    except:
        print("Table 'Meals' already exists")

    meals_table = service.get_table_client("Meals")

    print("\nSeeding Meals table...\n")

    for area in AREAS:
        for restaurant, meals in MEALS[area].items():

            for meal_name, meal_desc in meals:

                row = {
                    "PartitionKey": area,
                    "RowKey": str(uuid4()),
                    "restaurantName": restaurant,
                    "name": meal_name,
                    "description": meal_desc,
                    "prepMinutes": 30,
                    "price": 12
                }

                meals_table.create_entity(entity=row)

            print(f"Inserted 3 meals for: {restaurant}")

    print("\n Meals table is now fully updated with real Madrid meals.\n")


if __name__ == "__main__":
    seed_data()
