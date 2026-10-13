import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const locations = [
    // Highly Accessible (Green) - ~5/5
    {
        name: "Vadakkunnathan Temple (Outer Periphery)",
        address: "Swaraj Round N, Thekkinkadu Maidan, Thrissur, Kerala 680001",
        latitude: 10.5244,
        longitude: 76.2160,
        description: "The surrounding grounds have been paved and offer excellent level access for wheelchairs.",
        contact: "+91 487 242 6056",
        rating: 4.8,
        features: {
            wheelchairAccessible: true,
            accessibleRestrooms: true,
            accessibleParking: true,
            rampAccess: true,
            levelSurfaces: true,
            visualAudioAssistance: false,
            wideDoorways: true,
            elevatorAccess: false,
        }
    },
    {
        name: "Lulu Mall Thrissur",
        address: "Puzhakkal, Ayyanthole, Thrissur, Kerala 680003",
        latitude: 10.5408,
        longitude: 76.1915,
        description: "Modern shopping mall with comprehensive accessibility features across all floors.",
        contact: "+91 487 238 1111",
        rating: 4.9,
        features: {
            wheelchairAccessible: true,
            accessibleRestrooms: true,
            accessibleParking: true,
            rampAccess: true,
            elevatorAccess: true,
            visualAudioAssistance: true,
            wideDoorways: true,
            levelSurfaces: true,
        }
    },
    {
        name: "Jubilee Mission Medical College Hospital",
        address: "East Yakkara, Thrissur, Kerala 680005",
        latitude: 10.5186,
        longitude: 76.2233,
        description: "Major hospital fully equipped with ramps, wide doorways, and accessible facilities.",
        contact: "+91 487 243 2200",
        rating: 4.5,
        features: {
            wheelchairAccessible: true,
            accessibleRestrooms: true,
            accessibleParking: true,
            rampAccess: true,
            elevatorAccess: true,
            visualAudioAssistance: true,
            wideDoorways: true,
            levelSurfaces: true,
        }
    },
    {
        name: "Thrissur Railway Station (TCR)",
        address: "Railway Station Rd, Poothole, Thrissur, Kerala 680004",
        latitude: 10.5161,
        longitude: 76.2132,
        description: "Major transit hub with ramps, elevators between platforms, and accessible restrooms.",
        contact: "139",
        rating: 4.3,
        features: {
            wheelchairAccessible: true,
            accessibleRestrooms: true,
            accessibleParking: true,
            rampAccess: true,
            elevatorAccess: true,
            visualAudioAssistance: true,
            wideDoorways: true,
            levelSurfaces: true,
        }
    },

    // Mostly Accessible (Yellow) - ~4/5
    {
        name: "Kerala Kalamandalam (Deemed University)",
        address: "Vallathol Nagar, Cheruthuruthy, Thrissur, Kerala 679531",
        latitude: 10.7410,
        longitude: 76.2750,
        description: "Premier center for performing arts. Most main buildings have ramp access, but some older structures lack elevators.",
        contact: "+91 4884 262 418",
        rating: 4.6,
        features: {
            wheelchairAccessible: true,
            accessibleRestrooms: true,
            accessibleParking: true,
            rampAccess: true,
            elevatorAccess: false,
            visualAudioAssistance: false,
            wideDoorways: true,
            levelSurfaces: true,
        }
    },
    {
        name: "Thrissur Zoo and State Museum",
        address: "Town Hall Rd, Chembukkav, Thrissur, Kerala 680020",
        latitude: 10.5317,
        longitude: 76.2201,
        description: "Pathways are generally wide and paved, though some animal enclosures are difficult to view from a seated position.",
        contact: "+91 487 233 3056",
        rating: 4.1,
        features: {
            wheelchairAccessible: true,
            accessibleRestrooms: true,
            accessibleParking: false,
            rampAccess: true,
            elevatorAccess: false,
            visualAudioAssistance: false,
            wideDoorways: true,
            levelSurfaces: true,
        }
    },
    {
        name: "Sobha City Mall",
        address: "Puzhakkal Padam, Guruvayur Rd, Thrissur, Kerala 680553",
        latitude: 10.5484,
        longitude: 76.1923,
        description: "Good mobility access, but accessible restrooms can sometimes be locked or require staff assistance.",
        contact: "+91 487 238 9999",
        rating: 4.4,
        features: {
            wheelchairAccessible: true,
            accessibleRestrooms: true,
            accessibleParking: true,
            rampAccess: true,
            elevatorAccess: true,
            visualAudioAssistance: false,
            wideDoorways: true,
            levelSurfaces: false,
        }
    },
    {
        name: "Ramanilayam Government Guest House",
        address: "Palace Rd, Chembukkav, Thrissur, Kerala 680020",
        latitude: 10.5332,
        longitude: 76.2185,
        description: "Historic guest house. The ground floor is accessible, but access to upper floors may require stairs.",
        contact: "+91 487 233 2016",
        rating: 4.0,
        features: {
            wheelchairAccessible: true,
            accessibleRestrooms: true,
            accessibleParking: true,
            rampAccess: true,
            elevatorAccess: false,
            visualAudioAssistance: false,
            wideDoorways: true,
            levelSurfaces: true,
        }
    },

    // Somewhat Accessible (Orange) - ~3/5
    {
        name: "Shakthan Thampuran Palace",
        address: "Stadium Rd, Chembukkav, Thrissur, Kerala 680020",
        latitude: 10.5303,
        longitude: 76.2182,
        description: "Historic palace. Ramps have been added to some entrances, but interior thresholds and gravel paths are challenging.",
        contact: "+91 487 233 3310",
        rating: 4.2,
        features: {
            wheelchairAccessible: false,
            accessibleRestrooms: true,
            accessibleParking: true,
            rampAccess: true,
            elevatorAccess: false,
            visualAudioAssistance: false,
            wideDoorways: true,
            levelSurfaces: false,
        }
    },
    {
        name: "Our Lady of Dolours Basilica",
        address: "Pallitamam, Thrissur, Kerala 680001",
        latitude: 10.5204,
        longitude: 76.2188,
        description: "Large church. Entry involves a few steps; a temporary wooden ramp is sometimes available upon request.",
        contact: "N/A",
        rating: 4.7,
        features: {
            wheelchairAccessible: false,
            accessibleRestrooms: false,
            accessibleParking: true,
            rampAccess: true, // Temporary/steep
            elevatorAccess: false,
            visualAudioAssistance: false,
            wideDoorways: true,
            levelSurfaces: true,
        }
    },
    {
        name: "Vilangan Hills",
        address: "Amala Nagar, Thrissur, Kerala 680555",
        latitude: 10.5735,
        longitude: 76.1738,
        description: "Hillock with an amusement park. Accessing the top viewpoints involves significant inclines and uneven terrain.",
        contact: "N/A",
        rating: 4.1,
        features: {
            wheelchairAccessible: false,
            accessibleRestrooms: true,
            accessibleParking: true,
            rampAccess: false,
            elevatorAccess: false,
            visualAudioAssistance: false,
            wideDoorways: true,
            levelSurfaces: false,
        }
    },
    {
        name: "Paramekkavu Bhagavathy Temple (Festivals)",
        address: "Round East, Thrissur, Kerala 680001",
        latitude: 10.5252,
        longitude: 76.2198,
        description: "Heavily crowded during festivals. The main entrance has a small threshold, and no dedicated accessible parking.",
        contact: "N/A",
        rating: 4.8,
        features: {
            wheelchairAccessible: true,
            accessibleRestrooms: false,
            accessibleParking: false,
            rampAccess: false,
            elevatorAccess: false,
            visualAudioAssistance: false,
            wideDoorways: true,
            levelSurfaces: true,
        }
    },

    // Less Accessible (Red) - ~1/5
    {
        name: "Peechi Dam Viewpoint",
        address: "Peechi, Thrissur, Kerala 680653",
        latitude: 10.5290,
        longitude: 76.3687,
        description: "Popular viewpoint. Reaching the best viewing areas requires navigating steep, uneven stone steps.",
        contact: "N/A",
        rating: 4.4,
        features: {
            wheelchairAccessible: false,
            accessibleRestrooms: false,
            accessibleParking: true,
            rampAccess: false,
            elevatorAccess: false,
            visualAudioAssistance: false,
            wideDoorways: false,
            levelSurfaces: false,
        }
    },
    {
        name: "Athirappilly Water Falls (Bottom Trek)",
        address: "Athirappilly, Chalakudy Taluk, Thrissur, Kerala 680724",
        latitude: 10.2858,
        longitude: 76.5684,
        description: "The path down to the bottom of the falls is steep, rocky, and completely impassable for mobility devices.",
        contact: "N/A",
        rating: 4.8,
        features: {
            wheelchairAccessible: false,
            accessibleRestrooms: false,
            accessibleParking: false,
            rampAccess: false,
            elevatorAccess: false,
            visualAudioAssistance: false,
            wideDoorways: false,
            levelSurfaces: false,
        }
    },
    {
        name: "Chettuva Backwaters Boat Landing",
        address: "Chettuva, Chavakkad, Thrissur, Kerala 680506",
        latitude: 10.5361,
        longitude: 76.0354,
        description: "Boarding the traditional houseboats requires stepping across gaps and down steep, slippery banks.",
        contact: "N/A",
        rating: 4.3,
        features: {
            wheelchairAccessible: false,
            accessibleRestrooms: false,
            accessibleParking: false,
            rampAccess: false,
            elevatorAccess: false,
            visualAudioAssistance: false,
            wideDoorways: false,
            levelSurfaces: false,
        }
    },
    {
        name: "Local Street Market - MG Road",
        address: "MG Road, Thrissur, Kerala 680001",
        latitude: 10.5218,
        longitude: 76.2140,
        description: "Extremely crowded sidewalks with many step-ups, stalls blocking the path, and no dropped kerbs.",
        contact: "N/A",
        rating: 3.9,
        features: {
            wheelchairAccessible: false,
            accessibleRestrooms: false,
            accessibleParking: false,
            rampAccess: false,
            elevatorAccess: false,
            visualAudioAssistance: false,
            wideDoorways: false,
            levelSurfaces: false,
        }
    }
]

async function main() {
    console.log("Seeding database with Thrissur locations...")

    // Clear dependent tables first to avoid foreign key constraints
    await prisma.cONTRIBUTION.deleteMany({})
    await prisma.uSER_LOCATION.deleteMany({})
    await prisma.aCCESSIBILITY_FEATURE.deleteMany({})
    // Optional: Clear existing seeded locations to start fresh
    await prisma.lOCATION.deleteMany({})

    for (const loc of locations) {
        const { features, ...locationData } = loc

        // Create the location FIRST
        const location = await prisma.lOCATION.create({
            data: {
                ...locationData,
                status: "verified", // Assume seeded are automatically verified
                // calculating the accessibilityScore up to 5.00
                accessibilityScore: Number((Object.values(features).filter(v => typeof v === 'boolean' && v).length / Object.values(features).filter(v => typeof v === 'boolean').length * 5).toFixed(2)),
                features: {
                    create: features
                }
            }
        })
        console.log(`Created location: ${location.name}`)
    }
    console.log("Database seeded successfully!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
