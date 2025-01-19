from flask import Flask, render_template, request, send_file
from flask_cors import CORS
import pandas as pd
import requests
import datetime
from pymongo import MongoClient
import gridfs
from bson import ObjectId  # For MongoDB ObjectId
from flask import jsonify


# MongoDB setup
client = MongoClient("mongodb+srv://jatinsinha03:admin@cluster0.5enu7dl.mongodb.net/?retryWrites=true&w=majority")
db = client["nft_dataset_db"]  # Database name
fs = gridfs.GridFS(db)  # For file storage


app = Flask(__name__)
CORS(app)
# Your API Key
API_KEY = "316dd88ae8840897e1f61160265d1a3f"
BASE_URL = "https://api.unleashnfts.com/api/v2/nft/collection/"

# Load the initial dataset containing contract addresses
DATASET_PATH = "FInalDataset-1000NFTS.xlsx"  # Replace with the correct path to your dataset
data = pd.read_excel(DATASET_PATH)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate_dataset():
    # Get user input from the form
    num_data = int(request.form['num_data'])
    category = request.form['category']
    user_id = request.form['userId']  # User's MongoDB ObjectId as a string

    try:
        # Convert user ID to ObjectId
        user_object_id = ObjectId(user_id)
    except Exception as e:
        print(f"Invalid user ID: {e}")
        return "Invalid user ID", 400

    # Ensure the category is supported
    category_config = CATEGORY_CONFIG.get(category)
    if not category_config:
        return f"Invalid category: {category}", 400

    # Get the required number of contract addresses
    contract_addresses = data[['Contract Address', 'Collection Name']].head(num_data)

    # Prepare to store the final dataset
    final_data = []

    # Fetch data in chunks of 10
    for i in range(0, len(contract_addresses), 10):
        chunk = contract_addresses.iloc[i:i + 10]
        chunk_addresses = chunk['Contract Address'].tolist()
        response = category_config['fetch_function'](chunk_addresses)

        if response:
            # Merge collection names with fetched data
            for address in chunk_addresses:
                matching_entry = next((entry for entry in response if entry.get('contract_address', None) == address), None)
                if matching_entry:
                    # Add data if available
                    collection_name = chunk.loc[chunk['Contract Address'] == address, 'Collection Name'].values[0]
                    matching_entry['collection_name'] = collection_name
                    final_data.append(matching_entry)
                else:
                    # Add default row for missing data
                    collection_name = chunk.loc[chunk['Contract Address'] == address, 'Collection Name'].values[0]
                    final_data.append(generate_default_row(address, collection_name, category_config['columns']))
        else:
            # Add default rows for all addresses in the chunk
            for address in chunk_addresses:
                collection_name = chunk.loc[chunk['Contract Address'] == address, 'Collection Name'].values[0]
                final_data.append(generate_default_row(address, collection_name, category_config['columns']))

    # Log the total processed entries
    print(f"Total processed entries: {len(final_data)}/{num_data}")

    # Create a DataFrame from the final data
    final_df = pd.DataFrame(final_data)

    # Save the DataFrame to an Excel file
    output_path = f"generated_dataset_{category}.xlsx"
    final_df.to_excel(output_path, index=False)

    # Save the file and metadata to MongoDB
    try:
        with open(output_path, "rb") as f:
            file_id = fs.put(f, filename=output_path)
        
        # Save metadata to a collection
        db.datasets.insert_one({
            "userId": user_object_id,  # Store as ObjectId reference
            "datasetType": category,
            "timestamp": datetime.datetime.utcnow(),
            "fileId": file_id,  # GridFS file reference
            "numEntries": len(final_data)
        })
    except Exception as e:
        print(f"Error saving to MongoDB: {e}")
        return "Error saving dataset", 500

    return send_file(output_path, as_attachment=True)

@app.route('/fetch-file/<file_id>', methods=['GET'])
def fetch_file(file_id):
    try:
        # Fetch the file from GridFS
        file = fs.get(ObjectId(file_id))

        # Create a response to send the file back to the frontend
        response = send_file(
            file,
            as_attachment=True,
            download_name=file.filename  # Provide the filename
        )
        return response
    except Exception as e:
        print(f"Error fetching file: {e}")
        return "Error fetching file", 500

@app.route('/datasets', methods=['GET'])
def get_datasets():
    user_id = request.args.get('userId')  # Get the userId from the query parameters

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400  # Return 400 if userId is not provided

    try:
        # Convert userId to ObjectId
        user_object_id = ObjectId(user_id)
    except Exception as e:
        print(f"Invalid user ID: {e}")
        return jsonify({"error": "Invalid user ID"}), 400

    try:
        # Find datasets for the authenticated user
        datasets = db.datasets.find({"userId": user_object_id})
        result = []
        for dataset in datasets:
            result.append({
                "fileId": str(dataset["fileId"]),
                "datasetType": dataset["datasetType"],
                "timestamp": dataset["timestamp"],
                "numEntries": dataset["numEntries"],
            })
        return jsonify({"datasets": result})  # Return the list of datasets as JSON
    except Exception as e:
        print(f"Error fetching datasets: {e}")
        return jsonify({"error": "Internal server error"}), 500




def generate_default_row(address, collection_name, columns):
    """Generate a default row with None for all metrics based on category-specific columns."""
    default_row = {"contract_address": address, "collection_name": collection_name}
    default_row.update({column: None for column in columns if column not in default_row})
    return default_row


def fetch_collection_analytics(contract_addresses):
    """Fetch collection analytics data."""
    address_list = ",".join(contract_addresses)
    url = f"{BASE_URL}analytics?blockchain=ethereum&contract_address={address_list}&offset=0&limit=30&sort_by=sales&time_range=all&sort_order=desc"
    headers = {
        "accept": "application/json",
        "x-api-key": API_KEY
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json().get('data', [])  # Get the list of data entries
        return [
            {
                "contract_address": entry.get("contract_address", None),
                "assets": entry.get("assets", None),
                "assets_change": entry.get("assets_change", None),
                "floor_price": entry.get("floor_price", None),
                "floor_price_eth": entry.get("floor_price_eth", None),
                "sales": entry.get("sales", None),
                "sales_change": entry.get("sales_change", None),
                "transfers": entry.get("transfers", None),
                "transfers_change": entry.get("transfers_change", None),
                "volume": entry.get("volume", None),
                "volume_change": entry.get("volume_change", None),
            }
            for entry in data
        ]
    else:
        print(f"Error fetching data for chunk: {contract_addresses}: {response.status_code}")
        return None


def fetch_collection_holders_data(contract_addresses):
    """Fetch data for Collection Holders."""
    address_list = ",".join(contract_addresses)
    url = f"{BASE_URL}holders?blockchain=ethereum&contract_address={address_list}&time_range=all&offset=0&limit=30&sort_by=holders&sort_order=desc"
    headers = {
        "accept": "application/json",
        "x-api-key": API_KEY
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json().get('data', [])
        return [
            {
                "contract_address": entry.get("contract_address", None),
                "holders": entry.get("holders", None),
                "holders_change": entry.get("holders_change", None),
                "holders_tokens_1": entry.get("holders_tokens_1", None),
                "holders_tokens_2": entry.get("holders_tokens_2", None),
                "holders_tokens_3_5": entry.get("holders_tokens_3_5", None),
                "holders_tokens_6_9": entry.get("holders_tokens_6_9", None),
                "holders_tokens_9plus": entry.get("holders_tokens_9plus", None),
                "holders_tokens_10_15": entry.get("holders_tokens_10_15", None),
                "holders_tokens_16_25": entry.get("holders_tokens_16_25", None),
                "holders_tokens_25plus": entry.get("holders_tokens_25plus", None),
            }
            for entry in data
        ]
    else:
        print(f"Error fetching data for chunk: {contract_addresses}: {response.status_code}")
        return None

def fetch_collection_scores_data(contract_addresses):
    """Fetch data for Collection Scores."""
    address_list = ",".join(contract_addresses)
    url = f"{BASE_URL}scores?blockchain=ethereum&contract_address={address_list}&time_range=all&offset=0&limit=30&sort_by=market_cap&sort_order=desc"
    headers = {
        "accept": "application/json",
        "x-api-key": API_KEY
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json().get('data', [])
        return [
            {
                "contract_address": entry.get("contract_address", None),
                "market_cap": entry.get("market_cap", None),
                "marketcap_change": entry.get("marketcap_change", None),
                "minting_revenue": entry.get("minting_revenue", None),
                "price_avg": entry.get("price_avg", None),
                "price_avg_change": entry.get("price_avg_change", None),
                "price_ceiling": entry.get("price_ceiling", None),
                "royalty_price": entry.get("royalty_price", None),
            }
            for entry in data
        ]
    else:
        print(f"Error fetching data for chunk: {contract_addresses}: {response.status_code}")
        return None

def fetch_collection_traders_data(contract_addresses):
    """Fetch data for Collection Traders."""
    address_list = ",".join(contract_addresses)
    url = f"{BASE_URL}traders?blockchain=ethereum&contract_address={address_list}&offset=0&limit=30&sort_by=traders&time_range=all&sort_order=desc"
    headers = {
        "accept": "application/json",
        "x-api-key": API_KEY
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json().get('data', [])
        return [
            {
                "contract_address": entry.get("contract_address", None),
                "traders": entry.get("traders", None),
                "traders_buyers": entry.get("traders_buyers", None),
                "traders_buyers_change": entry.get("traders_buyers_change", None),
                "traders_change": entry.get("traders_change", None),
                "traders_sellers": entry.get("traders_sellers", None),
                "traders_sellers_change": entry.get("traders_sellers_change", None),
            }
            for entry in data
        ]
    else:
        print(f"Error fetching data for chunk: {contract_addresses}: {response.status_code}")
        return None

def fetch_collection_washtrade_data(contract_addresses):
    """Fetch data for Collection Washtrade."""
    address_list = ",".join(contract_addresses)
    url = f"{BASE_URL}washtrade?blockchain=ethereum&contract_address={address_list}&time_range=all&offset=0&limit=30&sort_by=washtrade_assets&sort_order=desc"
    headers = {
        "accept": "application/json",
        "x-api-key": API_KEY
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json().get('data', [])
        return [
            {
                "contract_address": entry.get("contract_address", None),
                "washtrade_assets": entry.get("washtrade_assets", None),
                "washtrade_assets_change": entry.get("washtrade_assets_change", None),
                "washtrade_suspect_sales": entry.get("washtrade_suspect_sales", None),
                "washtrade_suspect_sales_change": entry.get("washtrade_suspect_sales_change", None),
                "washtrade_volume": entry.get("washtrade_volume", None),
                "washtrade_volume_change": entry.get("washtrade_volume_change", None),
                "washtrade_wallets": entry.get("washtrade_wallets", None),
                "washtrade_wallets_change": entry.get("washtrade_wallets_change", None),
            }
            for entry in data
        ]
    else:
        print(f"Error fetching data for chunk: {contract_addresses}: {response.status_code}")
        return None


def fetch_collection_whales_data(contract_addresses):
    """Fetch data for Collection Whales."""
    address_list = ",".join(contract_addresses)
    url = f"{BASE_URL}whales?blockchain=ethereum&contract_address={address_list}&time_range=all&offset=0&limit=30&sort_by=nft_count&sort_order=desc"
    headers = {
        "accept": "application/json",
        "x-api-key": API_KEY
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json().get('data', [])
        return [
            {
                "contract_address": entry.get("contract_address", None),
                "buy_count": entry.get("buy_count", None),
                "buy_volume": entry.get("buy_volume", None),
                "buy_whales": entry.get("buy_whales", None),
                "mint_count": entry.get("mint_count", None),
                "mint_volume": entry.get("mint_volume", None),
                "mint_whales": entry.get("mint_whales", None),
                "nft_count": entry.get("nft_count", None),
                "sell_count": entry.get("sell_count", None),
                "sell_volume": entry.get("sell_volume", None),
                "sell_whales": entry.get("sell_whales", None),
                "total_mint_volume": entry.get("total_mint_volume", None),
                "total_sale_volume": entry.get("total_sale_volume", None),
                "unique_buy_wallets": entry.get("unique_buy_wallets", None),
                "unique_mint_wallets": entry.get("unique_mint_wallets", None),
                "unique_sell_wallets": entry.get("unique_sell_wallets", None),
                "unique_wallets": entry.get("unique_wallets", None),
                "whale_holders": entry.get("whale_holders", None),
            }
            for entry in data
        ]
    else:
        print(f"Error fetching data for chunk: {contract_addresses}: {response.status_code}")
        return None

def fetch_collection_profile_data(contract_addresses):
    """Fetch data for Collection Profile."""
    address_list = ",".join(contract_addresses)
    url = f"{BASE_URL}profile?blockchain=ethereum&contract_address={address_list}&time_range=all&offset=0&limit=30&sort_by=washtrade_index&sort_order=desc"
    headers = {
        "accept": "application/json",
        "x-api-key": API_KEY
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json().get('data', [])
        return [
            {
                "contract_address": entry.get("contract_address", None),
                "avg_loss_making_trades": entry.get("avg_loss_making_trades", None),
                "avg_profitable_trades": entry.get("avg_profitable_trades", None),
                "blockchain": entry.get("blockchain", None),
                "chain_id": entry.get("chain_id", None),
                "collection_score": entry.get("collection_score", None),
                "diamond_hands": entry.get("diamond_hands", None),
                "fear_and_greed_index": entry.get("fear_and_greed_index", None),
                "holder_metrics_score": entry.get("holder_metrics_score", None),
                "liquidity_score": entry.get("liquidity_score", None),
                "loss_making_trades": entry.get("loss_making_trades", None),
                "loss_making_trades_percentage": entry.get("loss_making_trades_percentage", None),
                "loss_making_volume": entry.get("loss_making_volume", None),
                "market_dominance_score": entry.get("market_dominance_score", None),
                "metadata_score": entry.get("metadata_score", None),
                "profitable_trades": entry.get("profitable_trades", None),
                "profitable_trades_percentage": entry.get("profitable_trades_percentage", None),
                "profitable_volume": entry.get("profitable_volume", None),
                "token_distribution_score": entry.get("token_distribution_score", None),
                "washtrade_index": entry.get("washtrade_index", None),
                "zero_profit_trades": entry.get("zero_profit_trades", None),
            }
            for entry in data
        ]
    else:
        print(f"Error fetching data for chunk: {contract_addresses}: {response.status_code}")
        return None


# Map categories to their respective fetch functions and columns
CATEGORY_CONFIG = {
    "Collection Analytics": {
        "fetch_function": fetch_collection_analytics,
        "columns": [
            "assets", "assets_change", "floor_price", "floor_price_eth",
            "sales", "sales_change", "transfers", "transfers_change",
            "volume", "volume_change"
        ],
    },
    "Collection Holders": {
        "fetch_function": fetch_collection_holders_data,
        "columns": ["holders", "holders_change","holders_tokens_1","holders_tokens_10_15","holders_tokens_16_25","holders_tokens_2","holders_tokens_25plus","holders_tokens_3_5","holders_tokens_6_9","holders_tokens_9plus"],
    },
    "Collection Scores": {
        "fetch_function": fetch_collection_scores_data,
        "columns": ["market_cap", "marketcap_change","minting_revenue","price_avg","price_avg_change","price_ceiling","royalty_price"],
    },
    "Collection Traders": {
        "fetch_function": fetch_collection_traders_data,
        "columns": ["traders", "traders_buyers","traders_buyers_change","traders_change","traders_sellers","traders_sellers_change"],
    },
    "Collection Washtrade": {
        "fetch_function": fetch_collection_washtrade_data,
        "columns": ["washtrade_assets", "washtrade_assets_change","washtrade_suspect_sales","washtrade_suspect_sales_change","washtrade_volume","washtrade_volume_change","washtrade_wallets","washtrade_wallets_change"],
    },
    "Collection Whales": {
        "fetch_function": fetch_collection_whales_data,
        "columns": ["buy_count", "buy_volume","buy_whales","mint_count","mint_volume","mint_whales","nft_count","sell_count","sell_volume","sell_whales","total_mint_volume","total_sale_volume","unique_buy_wallets","unique_mint_wallets","unique_sell_wallets","unique_wallets","whale_holders"],
    },
    "Collection Profile": {
        "fetch_function": fetch_collection_profile_data,
        "columns": [
            "avg_loss_making_trades",
            "avg_profitable_trades",
            "blockchain",
            "chain_id",
            "collection_score",
            "diamond_hands",
            "fear_and_greed_index",
            "holder_metrics_score",
            "liquidity_score",
            "loss_making_trades",
            "loss_making_trades_percentage",
            "loss_making_volume",
            "market_dominance_score",
            "metadata_score",
            "profitable_trades",
            "profitable_trades_percentage",
            "profitable_volume",
            "token_distribution_score",
            "washtrade_index",
            "zero_profit_trades"
        ],
    },
}

if __name__ == '__main__':
    app.run(debug=True)
