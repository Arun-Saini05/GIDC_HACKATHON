from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import math
import networkx as nx
from pydantic import BaseModel
import asyncio
import random
import uuid
from datetime import datetime, timedelta

app = FastAPI(title="SafeTravels India API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

district_lookup = {}
district_centroids = {}
display_to_node = {}   # display_name -> node_id (for user input matching)
crime_data = None
district_graph = None

def geo_dist(lat1, lng1, lat2, lng2):
    """Straight-line degree distance (cheap, sufficient for weight bias)."""
    return math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2)

def load_data():
    global crime_data, district_graph, district_lookup, district_centroids, display_to_node

    # --- GeoJSON ---
    geojson_path = os.path.join(DATA_DIR, "crime_data_v2.geojson")
    if os.path.exists(geojson_path):
        with open(geojson_path, 'r') as f:
            crime_data = json.load(f)
        valid_features = []
        for feature in crime_data['features']:
            props = feature['properties']
            d_name = props.get('district_std') or props.get('district')
            if d_name:
                district_lookup[d_name.upper().strip()] = props
                valid_features.append(feature)
        crime_data['features'] = valid_features
        print(f"Loaded crime data. Valid features: {len(valid_features)}")
    else:
        print(f"Warning: {geojson_path} not found.")

    # --- Graph ---
    graph_path = os.path.join(DATA_DIR, "district_graph.json")
    if os.path.exists(graph_path):
        with open(graph_path, 'r') as f:
            adj_data = json.load(f)
        district_graph = nx.DiGraph()
        for node, neighbors in adj_data.items():
            district_graph.add_node(node)
            for edge in neighbors:
                district_graph.add_edge(
                    node, edge['target'],
                    weight=edge['weight'],
                    distance=edge['distance'],
                    category=edge.get('category', 'No Data')
                )
        print(f"Loaded district graph: {district_graph.number_of_nodes()} nodes, {district_graph.number_of_edges()} edges.")
    else:
        print(f"Warning: {graph_path} not found.")

    # --- Centroids ---
    centroids_path = os.path.join(DATA_DIR, "district_centroids.json")
    if os.path.exists(centroids_path):
        with open(centroids_path, 'r') as f:
            district_centroids = json.load(f)

        # Build display_name -> node_id reverse mapping
        for node_id, info in district_centroids.items():
            disp = info.get('display_name', node_id).upper().strip()
            if disp not in display_to_node:
                display_to_node[disp] = node_id
            if node_id == disp:
                display_to_node[disp] = node_id
        print(f"Loaded centroids: {len(district_centroids)} districts, {len(display_to_node)} display mappings.")
    else:
        print(f"Warning: {centroids_path} not found.")

load_data()

# ── Real-Time Crime Tweets Simulated Stream ──────────────────────────────────────────

# In-memory store of active incidents detected via NLP/Twitter
active_incidents = []  # List of dicts

CRIME_KEYWORDS = [
    "murder", "killed", "stabbed", "stabbing", "shot", "shooting", 
    "robbery", "robbed", "theft", "stolen", "riot", "protest", 
    "violence", "assault", "attacked", "accident", "crash"
]

NEGATIVE_WORDS = [
    "terrible", "horrible", "scary", "avoid", "danger", "alert", 
    "warning", "bad", "panic", "blood", "dead", "fatal", "tragic", "emergency"
]

TWEET_TEMPLATES = [
    "A terrible {crime} just happened in {district}. People are panicking! Avoid the area.",
    "Emergency! Please avoid {district}, there's a huge {crime} right now. Stay safe everyone.",
    "Just witnessed a horrible {crime} at the main junction in {district}. Police are on the way. #Alert",
    "Warning: major {crime} reported in {district}. Traffic is stopped and the situation is scary.",
    "Tragic news coming from {district} about a {crime}... so sad.",
    "Violence erupting in {district}. It looks like a {crime}. Stay indoors!"
]

def analyze_tweet(text: str):
    """Offline NLP-style sentiment and entity extraction without external packages."""
    text_lower = text.lower()
    
    # 1. Check for crime presence
    detected_crime = None
    for crime in CRIME_KEYWORDS:
        if crime in text_lower:
            detected_crime = crime.title()
            break
            
    # 2. Check sentiment (must have negative words to be flagged as critical incident)
    sentiment_score = sum(1 for word in NEGATIVE_WORDS if word in text_lower)
    
    # 3. Extract location (district)
    detected_district = None
    # Sort by length descending to match longest district names first (e.g., "South Andaman" before "Andaman")
    sorted_districts = sorted(district_lookup.keys(), key=len, reverse=True)
    for dist in sorted_districts:
        # Check if district name is in text. 
        if dist.lower() in text_lower:
            detected_district = dist
            break
            
    is_critical_incident = (detected_crime is not None) and (sentiment_score > 0) and (detected_district is not None)
    
    return {
        "is_incident": is_critical_incident,
        "crime_type": detected_crime,
        "district": detected_district,
        "sentiment_score": sentiment_score
    }

def generate_simulated_tweet():
    if not district_lookup:
        return None
        
    district = random.choice(list(district_lookup.keys()))
    crime = random.choice(CRIME_KEYWORDS)
    template = random.choice(TWEET_TEMPLATES)
    
    tweet = template.format(crime=crime, district=district.title())
    return tweet

async def tweet_stream_loop():
    print("Started simulated X (Twitter) stream for real-time incidents...")
    while True:
        try:
            # Generate a new tweet ~40% of the time, to pace things out
            if random.random() < 0.4:
                raw_tweet = generate_simulated_tweet()
                if raw_tweet:
                    analysis = analyze_tweet(raw_tweet)
                    if analysis["is_incident"]:
                        district_upper = analysis["district"].upper()
                        # resolve node_id
                        node_id = display_to_node.get(district_upper, district_upper)
                        centroid = district_centroids.get(node_id)
                        
                        inc_lat, inc_lng = None, None
                        if centroid:
                            inc_lat, inc_lng = centroid["lat"], centroid["lng"]
                            
                        # Add to active incidents
                        now = datetime.now()
                        new_incident = {
                            "id": str(uuid.uuid4()),
                            "time": now.isoformat(),
                            "source_text": raw_tweet,
                            "crime_type": analysis["crime_type"],
                            "district": district_upper,
                            "lat": inc_lat,
                            "lng": inc_lng,
                            # Expiration for demo purposes (e.g. 15 minutes)
                            "expires": (now + timedelta(minutes=15)).isoformat()
                        }
                        
                        # Only keep last 15 incidents to prevent map clutter over long periods
                        global active_incidents
                        active_incidents.insert(0, new_incident)
                        active_incidents = active_incidents[:15]
                        print(f"[X STREAM ALERT] Extracted '{new_incident['crime_type']}' in '{new_incident['district']}' via tweet analysis.")
                        
            # Clean expired incidents
            current_time = datetime.now().isoformat()
            active_incidents[:] = [inc for inc in active_incidents if inc['expires'] > current_time]

        except Exception as e:
            print(f"Error in tweet stream: {e}")
            
        await asyncio.sleep(5) # run every 5s

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(tweet_stream_loop())
# ─────────────────────────────────────────────────────────────────────────────

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"message": "Welcome to SafeTravels India API V3"}

@app.get("/api/districts")
@app.get("/api/districts_v2")
@app.get("/api/districts_v3")
def get_districts():
    if crime_data:
        return crime_data
    return {"error": "Data not loaded"}

class RouteRequest(BaseModel):
    source: str
    destination: str

@app.post("/api/safest-route")
def get_safest_route(request: RouteRequest):
    if not district_graph:
        return {"error": "Graph data not loaded"}

    source = request.source.upper().strip()
    destination = request.destination.upper().strip()

    print(f"Route request: '{source}' -> '{destination}'")

    # Resolve user input to internal node_id
    def resolve_node(user_input):
        s = user_input.upper().strip()
        if s in district_graph:
            return s
        return display_to_node.get(s)

    source_node = resolve_node(source)
    dest_node   = resolve_node(destination)

    if not source_node:
        return {"error": f"Source district '{source}' not found."}
    if not dest_node:
        return {"error": f"Destination district '{destination}' not found."}

    try:
        # Directional-Biased Dijkstra:
        # Build a query-time modified weight graph that penalises edges moving
        # AWAY from the destination (backward penalty). This is still standard
        # Dijkstra -- just run on smarter precomputed weights so the algorithm
        # does not route geographically backwards through central/east India.
        #
        #   modified_weight = base_weight + max(0, dist_after - dist_before) * BIAS
        #
        # BIAS = 5.0  ->  going 1 degree backward adds 5x extra cost.

        # BACKWARD_BIAS penalizes going backwards, but 5.0 is too aggressive
        # combined with massive crime weights, leading to geographical zig-zags.
        BACKWARD_BIAS = 1.0

        use_bias = bool(
            district_centroids
            and source_node in district_centroids
            and dest_node in district_centroids
        )

        if use_bias:
            dest_c = district_centroids[dest_node]
            dest_lat, dest_lng = dest_c['lat'], dest_c['lng']

            query_graph = nx.DiGraph()
            for u, v, data in district_graph.edges(data=True):
                # Dynamically redefine base_weight to prevent massive detours
                # The exported graph has original geo-distance and categorical risk.
                dist = data.get('distance', data.get('weight', 1.0))
                cat = data.get('category', 'No Data')
                
                # Sensible penalties: High crime = +80% distance, Medium = +25%.
                # This ensures the algorithm actively tries to bypass dangerous clusters
                # (like the red zone across MH/CG/MP) without making a 1000km detour.
                penalty = 1.0
                if cat == 'High':
                    penalty = 1.8
                elif cat == 'Medium':
                    penalty = 1.25
                    
                # REAL-TIME INCIDENT PENALTY
                # Get current active incident districts
                active_nodes = {display_to_node.get(inc["district"], inc["district"]) for inc in active_incidents}
                if u in active_nodes or v in active_nodes:
                    penalty *= 20.0  # massive detour to avoid active crises
                
                base_weight = dist * penalty
                
                cu = district_centroids.get(u)
                cv = district_centroids.get(v)

                if cu and cv:
                    d_before = geo_dist(cu['lat'], cu['lng'], dest_lat, dest_lng)
                    d_after  = geo_dist(cv['lat'], cv['lng'], dest_lat, dest_lng)
                    backward = max(0.0, d_after - d_before)
                    modified = base_weight + (backward * BACKWARD_BIAS)
                else:
                    modified = base_weight

                query_graph.add_edge(u, v, weight=modified)

            path_names = nx.shortest_path(query_graph, source=source_node,
                                           target=dest_node, weight='weight')
            algo_used = "Dijkstra+DirectionalBias(Optimized)"
        else:
            # Create a sensibly-weighted graph even without bias
            query_graph = nx.DiGraph()
            active_nodes = {display_to_node.get(inc["district"], inc["district"]) for inc in active_incidents}
            
            for u, v, data in district_graph.edges(data=True):
                dist = data.get('distance', data.get('weight', 1.0))
                cat = data.get('category', 'No Data')
                penalty = 1.3 if cat == 'High' else (1.15 if cat == 'Medium' else 1.0)
                
                if u in active_nodes or v in active_nodes:
                    penalty *= 20.0
                    
                query_graph.add_edge(u, v, weight=dist * penalty)
                
            path_names = nx.shortest_path(query_graph, source=source_node,
                                           target=dest_node, weight='weight')
            algo_used = "Dijkstra(Optimized)"

        print(f"[{algo_used}] {len(path_names)} hops: {' -> '.join(path_names)}")

        # Enrich with crime details - use display_name for UI, node_id for lookup
        detailed_path = []
        for node_id in path_names:
            c_info = district_centroids.get(node_id, {})
            display_name = c_info.get('display_name', node_id)
            details = district_lookup.get(display_name, district_lookup.get(node_id, {}))
            detailed_path.append({
                "name": display_name,
                "risk": details.get('Hotspot_Category', 'Unknown'),
                "wci":  details.get('WCI', 0)
            })

        return {"path": detailed_path}

    except nx.NetworkXNoPath:
        return {"error": "No path found between these districts."}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/realtime-crimes")
def get_realtime_crimes():
    """Return currently active incidents scraped via simulated X stream."""
    return {"incidents": active_incidents}

@app.get("/api/road-crimes")
def get_road_crimes():
    """Return road crime classification data for all districts."""
    if not crime_data:
        return {"error": "Data not loaded"}

    results = []
    for feature in crime_data['features']:
        props = feature['properties']
        district = props.get('district_std') or props.get('district')
        if not district:
            continue
        results.append({
            "district": district,
            "state": props.get('st_nm', 'Unknown'),
            "road_crime_score": round(props.get('Road_Crime_Score', 0), 4),
            "road_crime_category": props.get('Road_Crime_Category', 'No Data'),
            "rash_driving": round(props.get('incidence_of_rash_driving', 0), 4),
            "motor_vehicle": round(props.get('motor_vehicle_act', 0), 4),
            "death_by_negligence": round(props.get('causing_death_by_negligence', 0), 4),
            "robbery": round(props.get('robbery', 0), 4),
        })
    return results

@app.get("/api/women-crimes")
def get_women_crimes():
    """Return women crime classification data for all districts."""
    if not crime_data:
        return {"error": "Data not loaded"}

    results = []
    for feature in crime_data['features']:
        props = feature['properties']
        district = props.get('district_std') or props.get('district')
        if not district:
            continue
        results.append({
            "district": district,
            "state": props.get('st_nm', 'Unknown'),
            "women_crime_score": round(props.get('Women_Crime_Score', 0), 4),
            "women_crime_category": props.get('Women_Crime_Category', 'No Data'),
            "rape": round(props.get('rape', 0), 4),
            "dowry_deaths": round(props.get('dowry_deaths', 0), 4),
            "assault_on_women": round(props.get('assault_on_women', 0), 4),
            "cruelty_by_husband": round(props.get('cruelty_by_husband_or_his_relatives', 0), 4),
            "attempt_to_commit_rape": round(props.get('attempt_to_commit_rape', 0), 4),
            "insult_to_the_modesty_of_women": round(props.get('insult_to_the_modesty_of_women', 0), 4)
        })
    return results


@app.get("/api/state-boundary/{state_name}")
def get_state_boundary(state_name: str):
    """Return a dissolved (outer boundary only) GeoJSON polygon for a state."""
    import geopandas as gpd
    from shapely.ops import unary_union
    import json as _json

    geojson_path = os.path.join(DATA_DIR, "crime_data_v2.geojson")
    if not os.path.exists(geojson_path):
        return {"error": "GeoJSON not found"}

    gdf = gpd.read_file(geojson_path)
    query = state_name.strip().upper()

    # Match state (case-insensitive)
    mask = gdf['st_nm'].str.upper().str.strip() == query
    state_gdf = gdf[mask]

    if state_gdf.empty:
        # Try partial match
        mask = gdf['st_nm'].str.upper().str.strip().str.contains(query, na=False)
        state_gdf = gdf[mask]

    if state_gdf.empty:
        return {"error": f"State '{state_name}' not found"}

    # Dissolve all districts into a single polygon
    dissolved = unary_union(state_gdf.geometry)
    dissolved_gdf = gpd.GeoDataFrame(geometry=[dissolved], crs=gdf.crs)
    return _json.loads(dissolved_gdf.to_json())


@app.get("/api/search")
def search(q: str = ""):
    """Search for a district or state by name. Returns district info or state-level aggregates."""
    if not crime_data or not q.strip():
        return {"type": "error", "message": "No query provided"}

    query = q.strip().upper()
    features = crime_data['features']

    # ── 1. Try exact / partial district match first ──────────────────────────
    district_matches = [
        f['properties'] for f in features
        if query in (f['properties'].get('district_std') or '').upper()
    ]
    if len(district_matches) == 1 or (district_matches and district_matches[0].get('district_std', '').upper() == query):
        p = district_matches[0]
        return {
            "type": "district",
            "name": p.get('district_std'),
            "state": p.get('st_nm'),
            "category": p.get('Hotspot_Category', 'No Data'),
            "wci": round(p.get('WCI', 0), 3),
            "future_trend": p.get('Future_Increase_Chance', 'N/A'),
            "road_crime_category": p.get('Road_Crime_Category', 'No Data'),
            "road_crime_trend": p.get('Road_Crime_Future_Trend'),
            "women_crime_category": p.get('Women_Crime_Category', 'No Data'),
            "women_crime_trend": p.get('Women_Crime_Future_Trend'),
        }

    # ── 2. Try state match ───────────────────────────────────────────────────
    state_districts = [
        f['properties'] for f in features
        if query in (f['properties'].get('st_nm') or '').upper()
    ]
    if state_districts:
        state_name = state_districts[0].get('st_nm', query.title())
        count = len(state_districts)

        wci_values = [p.get('WCI', 0) for p in state_districts if p.get('WCI') is not None]
        avg_wci = round(sum(wci_values) / len(wci_values), 3) if wci_values else 0

        # Parse numeric trends and average them
        trend_values = []
        for p in state_districts:
            t = p.get('Future_Increase_Chance', '')
            try:
                trend_values.append(float(str(t).replace('%', '')))
            except Exception:
                pass
        avg_trend = round(sum(trend_values) / len(trend_values), 1) if trend_values else None
        avg_trend_str = f"{avg_trend:+.1f}%" if avg_trend is not None else "N/A"

        # Risk distribution
        cats = [p.get('Hotspot_Category', 'No Data') for p in state_districts]
        high_count = cats.count('High')
        med_count  = cats.count('Medium')
        low_count  = cats.count('Low')
        total_classified = high_count + med_count + low_count
        high_pct = round(high_count / total_classified * 100) if total_classified else 0
        med_pct  = round(med_count  / total_classified * 100) if total_classified else 0
        low_pct  = round(low_count  / total_classified * 100) if total_classified else 0

        # Overall state category = majority
        from collections import Counter
        majority_cat = Counter(cats).most_common(1)[0][0] if cats else 'No Data'

        return {
            "type": "state",
            "name": state_name,
            "district_count": count,
            "avg_wci": avg_wci,
            "overall_category": majority_cat,
            "future_trend": avg_trend_str,
            "high_pct": high_pct,
            "med_pct": med_pct,
            "low_pct": low_pct,
        }

    # ── 4. Fuzzy match — handles typos (e.g. "maharastra" → "Maharashtra") ──
    import difflib

    # Collect unique state names and district names
    all_state_names  = list({(f['properties'].get('st_nm') or '').upper() for f in features if f['properties'].get('st_nm')})
    all_dist_names   = list({(f['properties'].get('district_std') or '').upper() for f in features if f['properties'].get('district_std')})

    # Try fuzzy state match first
    fuzzy_states = difflib.get_close_matches(query, all_state_names, n=1, cutoff=0.6)
    if fuzzy_states:
        # Re-run state logic with the corrected name
        corrected = fuzzy_states[0]
        state_districts = [
            f['properties'] for f in features
            if (f['properties'].get('st_nm') or '').upper() == corrected
        ]
        if state_districts:
            state_name = state_districts[0].get('st_nm', corrected.title())
            count = len(state_districts)
            wci_values = [p.get('WCI', 0) for p in state_districts if p.get('WCI') is not None]
            avg_wci = round(sum(wci_values) / len(wci_values), 3) if wci_values else 0
            trend_values = []
            for p in state_districts:
                try:
                    trend_values.append(float(str(p.get('Future_Increase_Chance', '')).replace('%', '')))
                except Exception:
                    pass
            avg_trend = round(sum(trend_values) / len(trend_values), 1) if trend_values else None
            avg_trend_str = f"{avg_trend:+.1f}%" if avg_trend is not None else "N/A"
            cats = [p.get('Hotspot_Category', 'No Data') for p in state_districts]
            from collections import Counter
            high_count = cats.count('High'); med_count = cats.count('Medium'); low_count = cats.count('Low')
            total_cls = high_count + med_count + low_count
            majority_cat = Counter(cats).most_common(1)[0][0] if cats else 'No Data'
            return {
                "type": "state",
                "name": state_name,
                "fuzzy_corrected": True,
                "district_count": count,
                "avg_wci": avg_wci,
                "overall_category": majority_cat,
                "future_trend": avg_trend_str,
                "high_pct": round(high_count / total_cls * 100) if total_cls else 0,
                "med_pct":  round(med_count  / total_cls * 100) if total_cls else 0,
                "low_pct":  round(low_count  / total_cls * 100) if total_cls else 0,
            }

    # Try fuzzy district match
    fuzzy_dists = difflib.get_close_matches(query, all_dist_names, n=5, cutoff=0.6)
    if fuzzy_dists:
        return {
            "type": "suggestions",
            "matches": [
                {"name": n.title(), "state": next(
                    (f['properties'].get('st_nm') for f in features if (f['properties'].get('district_std') or '').upper() == n), ''
                )}
                for n in fuzzy_dists
            ]
        }

    return {"type": "not_found", "message": f"No district or state found for '{q}'"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

