-- Function to update the geom column based on latitude and longitude
CREATE OR REPLACE FUNCTION update_location_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude::double precision, NEW.latitude::double precision), 4326);
  ELSE
    NEW.geom = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run the function before INSERT or UPDATE
CREATE TRIGGER trg_update_location_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON "LOCATION"
FOR EACH ROW
EXECUTE FUNCTION update_location_geom();

-- Function to update the lastUpdated timestamp
CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."lastUpdated" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run the timestamp function before UPDATE
CREATE TRIGGER trg_update_location_timestamp
BEFORE UPDATE ON "LOCATION"
FOR EACH ROW
EXECUTE FUNCTION update_location_timestamp();