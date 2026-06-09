import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { subscribeSchools, addSchool, updateSchool } from '../lib/firestoreData';
import { optimizeSchedule } from '../lib/dispersal';
import { generateDispersalSchedulePDF } from '../lib/pdf';
import { Spinner, EmptyState } from '../components/Loading';

// Bareilly city centre as default map view
const BAREILLY_CENTER = [28.367, 79.416];

// Custom school marker icon
const schoolIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const pickerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Click handler component inside MapContainer
function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    },
  });
  return null;
}

// Flies map to a given position when it changes
function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 16, { duration: 1.2 });
  }, [position, map]);
  return null;
}

const initialForm = {
  name: '',
  currentDispersalTime: '13:00',
  distanceMeters: '',
  population: '',
  privateCarPercent: '',
  autoPercent: '',
  busPercent: '',
  walkerPercent: '',
};

export default function SchoolDispersal() {
  const { isObserver, name } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [pickedLocation, setPickedLocation] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Inline edit state for dispersal time
  const [editingId, setEditingId] = useState(null);
  const [editingTime, setEditingTime] = useState('');

  useEffect(() => {
    const unsub = subscribeSchools((data) => {
      setSchools(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const optimized = optimizeSchedule(schools);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const splitTotal =
    (Number(form.privateCarPercent) || 0) +
    (Number(form.autoPercent) || 0) +
    (Number(form.busPercent) || 0) +
    (Number(form.walkerPercent) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('School name is required.'); return; }
    if (splitTotal !== 0 && splitTotal !== 100) {
      setError('Vehicle type split percentages should add up to 100%.');
      return;
    }
    setSubmitting(true);
    try {
      await addSchool({
        name: form.name.trim(),
        currentDispersalTime: form.currentDispersalTime,
        distanceMeters: Number(form.distanceMeters) || 0,
        population: Number(form.population) || 0,
        lat: pickedLocation?.lat ?? null,
        lng: pickedLocation?.lng ?? null,
        vehicleSplit: {
          privateCarPercent: Number(form.privateCarPercent) || 0,
          autoPercent: Number(form.autoPercent) || 0,
          busPercent: Number(form.busPercent) || 0,
          walkerPercent: Number(form.walkerPercent) || 0,
        },
      });
      setForm(initialForm);
      setPickedLocation(null);
      setShowMapPicker(false);
    } catch {
      setError('Could not save school. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    generateDispersalSchedulePDF({
      schools: optimized,
      date: format(new Date(), 'yyyy-MM-dd'),
      observerName: name,
    });
  };

  const useMyLocation = () => {
    setLocError('');
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setShowMapPicker(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickedLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) setLocError('Location access denied. Please allow location in your browser settings.');
        else setLocError('Could not get your location. Try clicking on the map instead.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startEdit = (school) => {
    setEditingId(school.id);
    setEditingTime(school.currentDispersalTime);
  };

  const saveEdit = async (id) => {
    await updateSchool(id, { currentDispersalTime: editingTime });
    setEditingId(null);
  };

  const schoolsWithLocation = schools.filter((s) => s.lat && s.lng);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-arf-navy">School Dispersal Optimizer</h1>
        <p className="text-sm text-gray-500">
          Recommends staggered dispersal times for schools near Prem Nagar Chauraha to ease congestion during 13:00–15:00.
        </p>
      </div>

      {/* Add School Form */}
      {isObserver && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-arf-navy mb-4">Add a School</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="School name">
                <input className={inputCls} value={form.name} onChange={handleChange('name')} required />
              </Field>
              <Field label="Current dispersal time (HH:MM)">
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. 13:30"
                  value={form.currentDispersalTime}
                  onChange={handleChange('currentDispersalTime')}
                  pattern="^([01]\d|2[0-3]):[0-5]\d$"
                  title="Enter time in 24-hour HH:MM format, e.g. 13:30"
                  required
                />
              </Field>
              <Field label="Approx. distance from junction (m)">
                <input type="number" min="0" className={inputCls} value={form.distanceMeters} onChange={handleChange('distanceMeters')} required />
              </Field>
              <Field label="Estimated student population">
                <input type="number" min="0" className={inputCls} value={form.population} onChange={handleChange('population')} required />
              </Field>
              <Field label="Private cars (%)">
                <input type="number" min="0" max="100" className={inputCls} value={form.privateCarPercent} onChange={handleChange('privateCarPercent')} />
              </Field>
              <Field label="Autos (%)">
                <input type="number" min="0" max="100" className={inputCls} value={form.autoPercent} onChange={handleChange('autoPercent')} />
              </Field>
              <Field label="School buses (%)">
                <input type="number" min="0" max="100" className={inputCls} value={form.busPercent} onChange={handleChange('busPercent')} />
              </Field>
              <Field label="Walkers (%)">
                <input type="number" min="0" max="100" className={inputCls} value={form.walkerPercent} onChange={handleChange('walkerPercent')} />
              </Field>
            </div>

            {/* Map Location Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-arf-text">
                  School location on map{' '}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locating}
                    className="text-xs font-medium text-white bg-arf-navy rounded px-3 py-1.5 hover:bg-arf-navy/90 transition disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {locating ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Locating…
                      </>
                    ) : '📡 Use My Location'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker((v) => !v)}
                    className="text-xs font-medium text-arf-navy border border-arf-navy/30 rounded px-3 py-1.5 hover:bg-arf-navy/10 transition"
                  >
                    {showMapPicker ? 'Hide map' : pickedLocation ? '📍 Change on map' : '📍 Pick on map'}
                  </button>
                </div>
              </div>

              {locError && (
                <p className="text-xs text-arf-red bg-arf-red/10 border border-arf-red/20 rounded px-3 py-1.5 mb-2">{locError}</p>
              )}

              {pickedLocation && !showMapPicker && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-1.5">
                  ✅ Location set: {pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)}
                  <button type="button" onClick={() => setPickedLocation(null)} className="ml-2 text-arf-red hover:underline">Remove</button>
                </p>
              )}

              {showMapPicker && (
                <div className="rounded-lg overflow-hidden border border-gray-300">
                  <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 border-b border-gray-200">
                    📡 Hit "Use My Location" to auto-pin your current position, or click anywhere on the map to place the pin manually
                  </p>
                  <MapContainer
                    center={BAREILLY_CENTER}
                    zoom={13}
                    style={{ height: '300px', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <LocationPicker onPick={(latlng) => setPickedLocation(latlng)} />
                    <FlyTo position={pickedLocation} />
                    {pickedLocation && (
                      <Marker position={pickedLocation} icon={pickerIcon}>
                        <Popup>{form.name || 'New school'}</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                  {pickedLocation && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 border-t border-gray-200">
                      ✅ Pin at {pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)} — click map to move it
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-arf-navy text-white text-sm font-semibold rounded-md px-5 py-2.5 hover:bg-arf-navy/90 transition disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Add School'}
              </button>
              {error && <span className="text-sm text-arf-red">{error}</span>}
            </div>
          </form>
        </div>
      )}

      {/* Schools on Map */}
      {schoolsWithLocation.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-arf-navy">Schools on Map</h2>
            <p className="text-xs text-gray-500 mt-0.5">Showing {schoolsWithLocation.length} school{schoolsWithLocation.length > 1 ? 's' : ''} with a pinned location</p>
          </div>
          <MapContainer
            center={BAREILLY_CENTER}
            zoom={13}
            style={{ height: '300px', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {schoolsWithLocation.map((s) => (
              <Marker key={s.id} position={[s.lat, s.lng]} icon={schoolIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-gray-500">Dispersal: {s.currentDispersalTime}</p>
                    <p className="text-gray-500">Population: {s.population}</p>
                    <p className="text-gray-500">Distance: {s.distanceMeters}m</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Schedule Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-arf-navy">Recommended Staggered Schedule</h2>
          <button
            onClick={handlePrint}
            disabled={optimized.length === 0}
            className="text-sm font-medium border border-arf-navy text-arf-navy rounded-md px-4 py-2 hover:bg-arf-navy hover:text-white transition disabled:opacity-40"
          >
            Generate Printable Schedule (PDF)
          </button>
        </div>

        {loading ? (
          <Spinner label="Loading schools…" />
        ) : optimized.length === 0 ? (
          <EmptyState
            title="No schools added yet"
            message={
              isObserver
                ? 'Add a school above to generate optimized dispersal recommendations for the pilot zone.'
                : 'ARF observers have not yet registered any schools for this junction.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-arf-navy text-white text-left">
                  <th className="px-4 py-3 font-semibold">School</th>
                  <th className="px-4 py-3 font-semibold">Current Dispersal</th>
                  <th className="px-4 py-3 font-semibold">Proposed Dispersal</th>
                  <th className="px-4 py-3 font-semibold">Distance</th>
                  <th className="px-4 py-3 font-semibold">Impact</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {optimized.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-arf-bg'}>
                    <td className="px-4 py-3 font-medium text-arf-text">{s.name}</td>
                    <td className="px-4 py-3">
                      {isObserver && editingId === s.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="HH:MM"
                            className="rounded border border-gray-300 px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-arf-navy/40"
                            value={editingTime}
                            onChange={(e) => setEditingTime(e.target.value)}
                            pattern="^([01]\d|2[0-3]):[0-5]\d$"
                            title="Enter time in 24-hour HH:MM format"
                          />
                          <button
                            onClick={() => saveEdit(s.id)}
                            className="text-xs font-semibold text-white bg-arf-navy rounded px-2 py-1 hover:bg-arf-navy/90"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-gray-500 hover:text-arf-red"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{s.currentDispersalTime}</span>
                          {isObserver && (
                            <button
                              onClick={() => startEdit(s)}
                              className="text-[11px] text-arf-navy border border-arf-navy/30 rounded px-1.5 py-0.5 hover:bg-arf-navy/10 transition"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-arf-text font-semibold">{s.proposedDispersal}</td>
                    <td className="px-4 py-3 text-gray-500">{s.distanceMeters}m</td>
                    <td className="px-4 py-3"><ImpactBadge level={s.impact} /></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-arf-navy/40 focus:border-arf-navy';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-arf-text mb-1">{label}</span>
      {children}
    </label>
  );
}

function ImpactBadge({ level }) {
  const tone = { High: 'bg-arf-red/10 text-arf-red', Medium: 'bg-arf-orange/10 text-arf-orange', Low: 'bg-arf-navy/10 text-arf-navy' }[level];
  return <span className={`text-xs font-semibold px-2 py-1 rounded ${tone}`}>{level}</span>;
}
