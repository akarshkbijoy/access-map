# AccessMap ML — Annotation Guide
## How to Annotate Accessibility Features for Training

This guide explains how to annotate images for the AccessMap accessibility feature detection model. Follow these guidelines carefully to ensure consistent, high-quality training data.

---

## Tools

We recommend using one of these annotation tools:
- **[CVAT](https://cvat.ai/)** — Free, cloud-based, team collaboration
- **[LabelImg](https://github.com/heartexlabs/labelImg)** — Simple desktop tool
- **[Roboflow](https://roboflow.com/)** — Cloud-based with augmentation
- **[Label Studio](https://labelstud.io/)** — Open-source, flexible

Export annotations in **YOLO format** when possible.

---

## Class Definitions

### Class 0: `wheelchair`
**What to annotate:** Manual wheelchairs, powered wheelchairs, mobility scooters
- Draw a tight box around the entire wheelchair (including wheels)
- Include the person if they are seated in the wheelchair
- Do NOT annotate wheelchair symbols/icons (those are signage)

### Class 1: `wheelchair_ramp`
**What to annotate:** Permanent ramps, portable ramps, curb ramps, ramp approaches
- Draw a box that includes the entire ramp surface
- Include railings if they are part of the ramp structure
- Minimum visible: at least the inclined surface must be visible

### Class 2: `elevator`
**What to annotate:** Elevator doors (closed or open), elevator call panels
- For exterior: draw around the elevator door frame and panel
- For interior: draw around the visible elevator cabin entrance
- Include the elevator signage if visible near the door

### Class 3: `lift`
**What to annotate:** Platform lifts, stairlifts, wheelchair lifts
- Draw around the entire lift mechanism/platform
- Include the control panel if visible
- NOT regular elevators (those are class 2)

### Class 4: `stairs`
**What to annotate:** Indoor stairs, outdoor stairs, steps at entrances
- Draw a box around the visible stair section
- Include handrails ONLY if they are attached to the stairs
- A single step at a doorway: annotate if clearly visible
- Multiple staircases in one image: annotate each separately

### Class 5: `accessible_parking`
**What to annotate:** Parking spots with wheelchair symbol markings, blue/disabled parking signs
- Draw around the parking space including the painted symbol
- If only the sign is visible: draw around the sign
- Include the access aisle (striped area) if visible

### Class 6: `accessible_bathroom`
**What to annotate:** Bathrooms with accessibility features, accessible restroom signs
- Draw around the door/entrance with the accessibility sign
- If interior: draw around the accessible stall (wider stall with grab bars)
- Include the signage if it has the wheelchair symbol

### Class 7: `grab_bar`
**What to annotate:** Grab bars, handrails, support rails
- Draw a tight box around each individual grab bar
- Include wall-mounted grab bars in bathrooms
- Include stairway handrails
- Multiple grab bars in one image: annotate each separately

### Class 8: `doorway`
**What to annotate:** Doors, entrances, doorways (automatic and manual)
- Draw around the complete door frame
- Include automatic door sensors/buttons if visible
- Annotate both open and closed doors
- Focus on doors that are relevant to building access

### Class 9: `tactile_paving`
**What to annotate:** Tactile ground surface indicators, warning strips, guide paths
- Draw around the visible tactile paving surface
- Include truncated domes (raised bumps at crosswalks)
- Include directional tactile strips (lines on transit platforms)
- Multiple sections: annotate each continuous section separately

---

## Annotation Rules

### Bounding Box Guidelines
1. **Tight boxes**: Draw the tightest rectangle that fully contains the object
2. **No overlap**: Avoid overlapping boxes unless objects genuinely overlap
3. **Partial visibility**: Annotate objects that are at least 30% visible
4. **Minimum size**: Objects must be at least 20x20 pixels

### Quality Standards
1. **One class per object**: Each box should have exactly one class
2. **Multiple objects**: If multiple features are in one image, annotate ALL of them
3. **Ambiguous cases**: If you're unsure, skip the image rather than mislabel it
4. **Consistency**: Apply the same standard across all images

### Image Requirements
- **Resolution**: Minimum 640x640 pixels recommended
- **Format**: JPEG or PNG
- **Lighting**: Include images from various lighting conditions
- **Angles**: Include images from different angles and distances
- **Mix**: Aim for both indoor and outdoor scenes

---

## YOLO Annotation Format

Each image gets a corresponding `.txt` file with the same name:
```
image_001.jpg  →  image_001.txt
```

Each line in the `.txt` file represents one object:
```
class_id x_center y_center width height
```

All values are **normalized** (0 to 1):
- `x_center` = center X / image width
- `y_center` = center Y / image height
- `width` = box width / image width
- `height` = box height / image height

### Example
For an image that is 1920x1080 pixels with a wheelchair ramp at
position (500, 300) to (900, 600):

```
1 0.364583 0.416667 0.208333 0.277778
```

Calculation:
- class_id = 1 (wheelchair_ramp)
- x_center = (500 + 900) / 2 / 1920 = 0.364583
- y_center = (300 + 600) / 2 / 1080 = 0.416667
- width = (900 - 500) / 1920 = 0.208333
- height = (600 - 300) / 1080 = 0.277778

---

## Minimum Dataset Targets

| Class | Target Images | Priority |
|-------|--------------|----------|
| wheelchair | 500+ | Medium |
| wheelchair_ramp | 500+ | High |
| elevator | 500+ | High |
| lift | 200+ | Medium |
| stairs | 500+ | High (covered by Zenodo) |
| accessible_parking | 300+ | Medium |
| accessible_bathroom | 300+ | Medium |
| grab_bar | 500+ | High (covered by Zenodo) |
| doorway | 500+ | Medium |
| tactile_paving | 300+ | Medium |

---

## Data Collection Tips

1. **Permission**: Always get permission before photographing in buildings
2. **Diversity**: Vary locations, angles, lighting, and weather
3. **Real-world**: Use phone cameras at natural angles (how a user would see it)
4. **Negative examples**: Include images with NO accessibility features too
5. **Context**: Include features in their real context (not isolated close-ups only)
