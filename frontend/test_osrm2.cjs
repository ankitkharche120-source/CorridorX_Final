async function testOSRM() {
  const oLat = 18.5204;
  const oLng = 73.8567;
  const dLat = 18.5020;
  const dLng = 73.8290;
  
  const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(data.routes?.[0]?.geometry?.coordinates?.slice(0, 3) || 'No coordinates');
  } catch(e) {
    console.error("OSRM Error:", e);
  }
}

testOSRM();
