"""
Test script for boarding service
Run this after starting the service to verify endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8003"

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health Check: {response.status_code}")
    print(response.json())
    return response.status_code == 200

def test_create_property():
    """Test creating a property"""
    property_data = {
        "owner_id": 1,
        "property_name": "Sunrise Student Lodge",
        "location": "Nugegoda",
        "address": "123 Main Street, Nugegoda",
        "nearest_university": "University of Moratuwa",
        "distance_from_university": 0.5,
        "number_of_floors": 3,
        "total_rooms": 10,
        "latitude": 6.7964,
        "longitude": 79.9006,
        "amenities": ["WiFi", "Security", "Parking"]
    }
    
    response = requests.post(f"{BASE_URL}/boardings", json=property_data)
    print(f"\nCreate Property: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print(f"Created property ID: {data['id']}")
        return data['id']
    else:
        print(response.text)
        return None

def test_add_room(property_id):
    """Test adding a room"""
    room_data = {
        "room_number": "101",
        "room_type": "Single",
        "price": 9000,
        "floor_number": 1,
        "has_attached_bathroom": True,
        "has_balcony": False
    }
    
    response = requests.post(
        f"{BASE_URL}/rooms",
        params={"property_id": property_id},
        json=room_data
    )
    print(f"\nAdd Room: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print(f"Created room ID: {data['id']}")
        return data['id']
    else:
        print(response.text)
        return None

def test_list_properties():
    """Test listing properties"""
    response = requests.get(f"{BASE_URL}/boardings")
    print(f"\nList Properties: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Found {len(data)} properties")
        return data
    else:
        print(response.text)
        return []

def test_search_properties():
    """Test searching properties with filters"""
    params = {
        "university": "Moratuwa",
        "verified_only": False,
        "max_distance": 5.0
    }
    response = requests.get(f"{BASE_URL}/boardings", params=params)
    print(f"\nSearch Properties: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Found {len(data)} properties matching filters")
        return data
    else:
        print(response.text)
        return []

def run_tests():
    """Run all tests"""
    print("=" * 50)
    print("BOARDING SERVICE TESTS")
    print("=" * 50)
    
    # Test health
    if not test_health():
        print("\n❌ Service is not healthy. Exiting.")
        return
    
    # Test create property
    property_id = test_create_property()
    if not property_id:
        print("\n❌ Failed to create property. Check database connection.")
        return
    
    # Test add room
    room_id = test_add_room(property_id)
    if room_id:
        print(f"✓ Room {room_id} created successfully")
    
    # Test list
    properties = test_list_properties()
    
    # Test search
    filtered = test_search_properties()
    
    print("\n" + "=" * 50)
    print("✓ All tests completed!")
    print("=" * 50)

if __name__ == "__main__":
    try:
        run_tests()
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to service. Make sure it's running on port 8003")
    except Exception as e:
        print(f"❌ Error: {e}")
