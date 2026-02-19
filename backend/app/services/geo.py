import math
from typing import Tuple


def calculate_distance_meters(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """
    Calculate distance between two GPS coordinates using Haversine formula.

    Args:
        lat1: Latitude of first point in degrees
        lon1: Longitude of first point in degrees
        lat2: Latitude of second point in degrees
        lon2: Longitude of second point in degrees

    Returns:
        Distance in meters
    """
    R = 6371000

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return distance


def is_within_radius(
    employee_lat: float,
    employee_lon: float,
    location_lat: float,
    location_lon: float,
    allowed_radius_meters: int,
) -> Tuple[bool, float]:
    """
    Check if employee is within allowed radius of location.

    Args:
        employee_lat: Employee's latitude
        employee_lon: Employee's longitude
        location_lat: Location's latitude
        location_lon: Location's longitude
        allowed_radius_meters: Maximum allowed distance in meters

    Returns:
        Tuple of (is_within_radius, distance_meters)
    """
    distance = calculate_distance_meters(
        employee_lat, employee_lon, location_lat, location_lon
    )
    return distance <= allowed_radius_meters, distance
