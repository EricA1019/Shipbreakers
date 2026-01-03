use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct Room { pub x: i32, pub y: i32, pub w: i32, pub h: i32, pub kind: String }

#[derive(Serialize, Deserialize)]
pub struct Layout { pub template: String, pub rooms: Vec<Room> }

fn base_templates(name: &str) -> Vec<(i32,i32,i32,i32,&'static str)> {
    match name {
        "T-freighter" => vec![ (0,0,4,2,"cargo"), (-1,2,2,2,"engine"), (3,2,2,2,"bridge") ],
        "L-military" => vec![ (0,0,3,2,"corridor"),(3,0,2,2,"armory"),(0,2,3,2,"bridge") ],
        "Cross-science" => vec![ (1,0,2,1,"labs"),(0,1,4,2,"reactor"),(1,3,2,1,"bridge") ],
        "I-hauler" => vec![ (0,0,6,1,"cargo"),(0,1,6,1,"crew") ],
        "Square-civilian" => vec![ (0,0,3,3,"quarters"),(3,0,2,2,"galley") ],
        "H-luxury" => vec![ (0,0,2,2,"salon"),(3,0,2,2,"casino"),(1,3,3,1,"bridge") ],
        "U-industrial" => vec![ (0,0,4,2,"forge"),(0,2,1,2,"tank"),(3,2,1,2,"dock") ],
        "Scattered-derelict" => vec![ (0,0,1,1,"shard"),(2,0,1,1,"shard"),(1,2,2,1,"core") ],
        _ => vec![ (0,0,3,2,"cargo") ]
    }
}

// lightweight seeded RNG to avoid external dependencies (works in wasm)
struct SimpleRng { state: u64 }
impl SimpleRng {
    fn from_seed(seed: u64) -> Self { Self { state: seed.wrapping_add(0x9e3779b97f4a7c15) } }
    fn next_u64(&mut self) -> u64 {
        // xorshift64* variant
        let mut x = self.state;
        x ^= x >> 12;
        x ^= x << 25;
        x ^= x >> 27;
        self.state = x;
        self.state.wrapping_mul(2685821657736338717u64)
    }
    fn gen_range(&mut self, start: i32, end_inclusive: i32) -> i32 {
        let r = (self.next_u64() % ((end_inclusive - start + 1) as u64)) as i32;
        start + r
    }
}

pub fn generate_layout_from_template(seed: u64, template: &str) -> Layout {
    let base = base_templates(template);
    let mut rng = SimpleRng::from_seed(seed);
    let mut rooms = Vec::new();
    for (x,y,w,h,k) in base.into_iter() {
        // Slight random offset for variety
        let ox = x + rng.gen_range(-1, 1);
        let oy = y + rng.gen_range(-1, 1);
        let ow = w + rng.gen_range(0, 1);
        let oh = h + rng.gen_range(0, 1);
        rooms.push(Room{ x: ox, y: oy, w: ow, h: oh, kind: k.to_string() });
    }
    Layout{ template: template.to_string(), rooms }
}
