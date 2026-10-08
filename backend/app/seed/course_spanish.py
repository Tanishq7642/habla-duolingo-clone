"""Spanish for English speakers – demo course content.

Pure data. To add a language, write another module shaped like this one and
register it in seed.py; no application code changes.
"""

from app.seed.builders import bank, fill, match, mc, typed

W = "Write this in Spanish"

COURSE = {
    "learning": ("es", "Spanish", "🇪🇸"),
    "from": ("en", "English", "🇬🇧"),
    "title": "Spanish for English speakers",
    "units": [
        {
            "title": "Basics",
            "description": "Greet people, order food and name animals",
            "theme": "leaf",
            "skills": [
                {
                    "title": "Greetings", "icon": "👋", "description": "Say hello, goodbye and introduce yourself",
                    "lessons": [
                        ("Hello & goodbye", [
                            mc("Which one means “hello”?", ["hola", "adiós", "gracias", "perro"], "hola",
                               "“Hola” is the everyday way to say hello. The h is silent: OH-lah.",
                               emojis={"hola": "👋", "adiós": "🚪", "gracias": "🙏", "perro": "🐶"}),
                            mc("What does “adiós” mean?", ["goodbye", "hello", "please", "thanks"], "goodbye",
                               "“Adiós” means goodbye. Literally “to God”, but used casually."),
                            match([("hola", "hello"), ("adiós", "goodbye"), ("gracias", "thank you"),
                                   ("por favor", "please")]),
                            bank("Hello, good morning!", "Hola buenos días", ["noches", "gracias"],
                                 "“Buenos días” (good day) is used until around noon."),
                            typed(W, ["gracias"], "“Gracias” = thank you.", source="thank you"),
                        ]),
                        ("How are you?", [
                            mc("How do you say “good night”?",
                               ["buenas noches", "buenos días", "buenas tardes", "hasta luego"], "buenas noches",
                               "“Noche” is night. It's “buenas” because “noches” is feminine."),
                            fill("¿Cómo ___ tú?", ["estás", "eres", "tienes"], "estás", "How are you?",
                                 "“Estar” describes how you are right now, so we ask “¿Cómo estás?”."),
                            bank("I am fine, thank you.", "Estoy bien gracias", ["mal", "eres"],
                                 "“Estoy bien” = I'm well. Spanish often drops the subject “yo”."),
                            typed(W, ["buenas tardes"], "“Tarde” is afternoon, so “buenas tardes”.",
                                  source="good afternoon"),
                            match([("buenos días", "good morning"), ("buenas tardes", "good afternoon"),
                                   ("buenas noches", "good night"), ("hasta luego", "see you later")]),
                        ]),
                        ("Introductions", [
                            fill("Me ___ Ana.", ["llamo", "llamas", "llama"], "llamo", "My name is Ana.",
                                 "“Me llamo” literally means “I call myself”. With “me”, use the yo form: llamo."),
                            mc("What does “mucho gusto” mean?",
                               ["nice to meet you", "see you tomorrow", "very good", "thank you very much"],
                               "nice to meet you", "“Mucho gusto” = much pleasure, i.e. nice to meet you."),
                            bank("My name is Carlos.", "Me llamo Carlos", ["eres", "Tu"],
                                 "Both “Me llamo Carlos” and “Mi nombre es Carlos” are correct.",
                                 also=["Mi nombre es Carlos"]),
                            typed(W, ["mucho gusto", "encantado", "encantada"],
                                  "“Mucho gusto”, or “encantado/encantada” depending on your gender.",
                                  source="nice to meet you"),
                            mc("Choose “see you tomorrow”", ["hasta mañana", "hasta luego", "buenas noches", "adiós"],
                               "hasta mañana", "“Mañana” means tomorrow (and also morning)."),
                        ]),
                    ],
                },
                {
                    "title": "Food", "icon": "🍎", "description": "Fruit, drinks and things on the table",
                    "lessons": [
                        ("Fruit & drinks", [
                            mc("Which of these is “the apple”?", ["la manzana", "el agua", "el pan", "la leche"],
                               "la manzana", "“Manzana” is apple. It's feminine, so it takes “la”.",
                               emojis={"la manzana": "🍎", "el agua": "💧", "el pan": "🍞", "la leche": "🥛"}),
                            mc("Which of these is “the coffee”?", ["el café", "el jugo", "la leche", "el agua"],
                               "el café", "“Café” is coffee, and it's masculine: el café.",
                               emojis={"el café": "☕", "el jugo": "🧃", "la leche": "🥛", "el agua": "💧"}),
                            match([("manzana", "apple"), ("pan", "bread"), ("leche", "milk"), ("agua", "water")]),
                            fill("Yo ___ agua.", ["bebo", "como", "tengo"], "bebo", "I drink water.",
                                 "“Beber” = to drink. With “yo”, it becomes “bebo”."),
                            bank("I drink water.", "Yo bebo agua", ["como", "leche"],
                                 "“Bebo agua” alone is also fine – the verb already says “I”.",
                                 also=["Bebo agua"]),
                        ]),
                        ("At the table", [
                            fill("Ella ___ pan.", ["come", "bebe", "es"], "come", "She eats bread.",
                                 "“Comer” = to eat. For él/ella it's “come”."),
                            bank("The bread is good.", "El pan es bueno", ["la", "malo"],
                                 "“Pan” is masculine, so it's “el pan” and “bueno”."),
                            typed(W, ["la leche"], "“Leche” is feminine: la leche.", source="the milk"),
                            mc("What does “el queso” mean?", ["the cheese", "the egg", "the rice", "the fish"],
                               "the cheese", "“Queso” is cheese – think “quesadilla”."),
                            match([("queso", "cheese"), ("huevo", "egg"), ("arroz", "rice"), ("pescado", "fish")]),
                        ]),
                    ],
                },
                {
                    "title": "Animals", "icon": "🐶", "description": "Pets, farm animals and friends",
                    "lessons": [
                        ("Pets", [
                            mc("Which one is “the dog”?", ["el perro", "el gato", "el pájaro", "el caballo"],
                               "el perro", "“Perro” is dog.",
                               emojis={"el perro": "🐶", "el gato": "🐱", "el pájaro": "🐦", "el caballo": "🐴"}),
                            match([("perro", "dog"), ("gato", "cat"), ("pájaro", "bird"), ("pez", "fish")],
                                  "A live fish is “pez”; fish as food is “pescado”."),
                            fill("El ___ bebe leche.", ["gato", "pan", "agua"], "gato", "The cat drinks milk.",
                                 "Only an animal can drink: “el gato”."),
                            bank("The dog is big.", "El perro es grande", ["pequeño", "gato"],
                                 "“Grande” = big, “pequeño” = small."),
                            typed(W, ["el gato"], "“Gato” is cat; masculine, so “el gato”.", source="the cat"),
                        ]),
                        ("On the farm", [
                            mc("What is “el caballo”?", ["the horse", "the cow", "the bird", "the pig"], "the horse",
                               "“Caballo” is horse – related to “cavalry”."),
                            match([("vaca", "cow"), ("caballo", "horse"), ("cerdo", "pig"), ("oveja", "sheep")]),
                            bank("I have a cat.", "Yo tengo un gato", ["perro", "una"],
                                 "“Tengo” = I have. “Gato” is masculine, so “un”.", also=["Tengo un gato"]),
                            typed(W, ["el pájaro"], "“Pájaro” has an accent on the first a.", source="the bird"),
                            fill("La ___ come pasto.", ["vaca", "leche", "mesa"], "vaca", "The cow eats grass.",
                                 "“Vaca” = cow. Only the cow eats grass here!"),
                        ]),
                    ],
                },
            ],
        },
        {
            "title": "Everyday Words",
            "description": "Talk about your family and count things",
            "theme": "sky",
            "skills": [
                {
                    "title": "Family", "icon": "👪", "description": "Parents, siblings and grandparents",
                    "lessons": [
                        ("My family", [
                            mc("Which one means “the mother”?", ["la madre", "el padre", "la hermana", "el hijo"],
                               "la madre", "“Madre” = mother, “padre” = father."),
                            match([("madre", "mother"), ("padre", "father"), ("hermano", "brother"),
                                   ("hermana", "sister")]),
                            fill("Mi ___ se llama Luis.", ["padre", "madre", "hermana"], "padre",
                                 "My father is called Luis.", "Father = padre."),
                            bank("She is my sister.", "Ella es mi hermana", ["hermano", "tu"],
                                 "“Mi” = my, “tu” = your."),
                            typed(W, ["el hermano"], "Brother = hermano, sister = hermana.", source="the brother"),
                        ]),
                        ("Relatives", [
                            mc("What does “los abuelos” mean?",
                               ["the grandparents", "the parents", "the uncles", "the children"],
                               "the grandparents", "“Abuelo/abuela” = grandfather/grandmother."),
                            match([("abuelo", "grandfather"), ("abuela", "grandmother"), ("tío", "uncle"),
                                   ("tía", "aunt")]),
                            bank("My family is big.", "Mi familia es grande", ["pequeña", "su"],
                                 "“Familia” is feminine but “grande” doesn't change."),
                            fill("Tengo dos ___.", ["hermanos", "hermano", "padre"], "hermanos",
                                 "I have two brothers.", "After “dos” we need the plural: hermanos."),
                            typed(W, ["mi hijo"], "“Hijo” = son, “hija” = daughter.", source="my son"),
                        ]),
                    ],
                },
                {
                    "title": "Numbers", "icon": "🔢", "description": "Count from one to ten",
                    "lessons": [
                        ("One to five", [
                            mc("What number is “tres”?", ["3", "2", "4", "13"], "3", "“Tres” is three."),
                            match([("uno", "one"), ("dos", "two"), ("tres", "three"), ("cuatro", "four")]),
                            typed(W, ["cinco"], "Five = cinco.", source="five"),
                            fill("Tengo ___ gatos.", ["dos", "doce", "diez"], "dos", "I have two cats.",
                                 "Two = dos. Doce is twelve, diez is ten."),
                            bank("I have three dogs.", "Tengo tres perros", ["dos", "gatos"],
                                 "“Perros” is the plural of “perro”."),
                        ]),
                        ("Six to ten", [
                            mc("Which one is “ten”?", ["diez", "doce", "dos", "cien"], "diez",
                               "Diez = 10, doce = 12, cien = 100."),
                            match([("seis", "six"), ("siete", "seven"), ("ocho", "eight"), ("nueve", "nine")]),
                            typed(W, ["diez"], "Ten = diez.", source="ten"),
                            bank("One coffee, please.", "Un café por favor", ["dos", "gracias"],
                                 "“Un” is used for masculine nouns like café."),
                            fill("Son las ___.", ["ocho", "ocio", "oso"], "ocho", "It's eight o'clock.",
                                 "Ocho = eight. “Oso” is a bear!"),
                        ]),
                    ],
                },
            ],
        },
        {
            "title": "Simple Sentences",
            "description": "Use common verbs and order at a café",
            "theme": "sun",
            "skills": [
                {
                    "title": "Common Verbs", "icon": "🏃", "description": "Speak, eat, drink, live",
                    "lessons": [
                        ("I speak, I eat", [
                            fill("Nosotros ___ español.", ["hablamos", "habla", "hablo"], "hablamos",
                                 "We speak Spanish.", "With “nosotros”, -ar verbs end in -amos."),
                            mc("What does “yo como” mean?", ["I eat", "I drink", "I have", "I am"], "I eat",
                               "“Como” is the yo form of “comer” (to eat)."),
                            bank("I speak Spanish.", "Yo hablo español", ["inglés", "habla"],
                                 "“Hablo español” works too.", also=["Hablo español"]),
                            match([("hablar", "to speak"), ("comer", "to eat"), ("beber", "to drink"),
                                   ("vivir", "to live")]),
                            typed(W, ["yo vivo", "vivo"], "“Vivir” → yo vivo.", source="I live"),
                        ]),
                        ("Daily life", [
                            fill("Ellos ___ en Madrid.", ["viven", "vive", "vivo"], "viven", "They live in Madrid.",
                                 "With “ellos”, -ir verbs end in -en."),
                            mc("Choose “you read” (informal)", ["tú lees", "yo leo", "ella lee", "nosotros leemos"],
                               "tú lees", "Informal you = tú, and “leer” → tú lees."),
                            bank("We eat bread and cheese.", "Nosotros comemos pan y queso", ["bebemos", "leche"],
                                 "“Comemos” = we eat.", also=["Comemos pan y queso"]),
                            typed(W, ["ella bebe"], "“Beber” → ella bebe.", source="she drinks"),
                            match([("leer", "to read"), ("escribir", "to write"), ("correr", "to run"),
                                   ("dormir", "to sleep")]),
                        ]),
                    ],
                },
                {
                    "title": "At the Café", "icon": "☕", "description": "Order, ask prices and pay",
                    "lessons": [
                        ("Ordering", [
                            mc("How do you ask “How much is it?”",
                               ["¿Cuánto cuesta?", "¿Dónde está?", "¿Qué hora es?", "¿Cómo estás?"],
                               "¿Cuánto cuesta?", "“Cuánto” = how much, “cuesta” = it costs."),
                            bank("I would like a coffee.", "Quisiera un café", ["una", "té"],
                                 "“Quisiera” and “Me gustaría” are both polite ways to order.",
                                 also=["Me gustaría un café"]),
                            fill("La cuenta, por ___.", ["favor", "fiesta", "fuego"], "favor", "The check, please.",
                                 "“Por favor” = please."),
                            match([("café", "coffee"), ("té", "tea"), ("azúcar", "sugar"), ("cuenta", "check")]),
                            typed(W, ["un té por favor"], "“Té” takes an accent to differ from “te” (you).",
                                  source="a tea, please"),
                        ]),
                        ("Paying up", [
                            mc("What does “¿Dónde está el baño?” mean?",
                               ["Where is the bathroom?", "How much is the bathroom?", "Is the bathroom open?",
                                "What time is it?"],
                               "Where is the bathroom?", "“Dónde” = where, “baño” = bathroom."),
                            fill("¿___ cuesta el pan?", ["Cuánto", "Cómo", "Dónde"], "Cuánto",
                                 "How much is the bread?", "Prices are asked with “cuánto”."),
                            bank("The coffee is hot.", "El café está caliente", ["frío", "es"],
                                 "Temperature is a state, so we use “está”."),
                            typed(W, ["muchas gracias"], "“Muchas gracias” = thank you very much.",
                                  source="thank you very much"),
                            match([("caliente", "hot"), ("frío", "cold"), ("dulce", "sweet"), ("rico", "delicious")]),
                        ]),
                    ],
                },
            ],
        },
    ],
}

ACHIEVEMENTS = [
    # code, title, description, icon, metric, threshold
    ("first_lesson", "First Steps", "Complete your first lesson", "🎯", "lessons_completed", 1),
    ("perfect_lesson", "Flawless", "Finish a lesson without a single mistake", "💎", "perfect_lessons", 1),
    ("first_skill", "Skill Unlocked", "Complete every lesson in a skill", "🏅", "skills_completed", 1),
    ("xp_100", "Century", "Earn 100 XP", "⭐", "total_xp", 100),
    ("streak_3", "On Fire", "Reach a 3-day streak", "🔥", "streak", 3),
    ("streak_7", "Week Warrior", "Reach a 7-day streak", "🌋", "streak", 7),
    ("lessons_10", "Dedicated", "Complete 10 lessons", "📚", "lessons_completed", 10),
    ("practice_1", "Back to Basics", "Finish a practice session", "💪", "practice_sessions", 1),
    ("xp_500", "Scholar", "Earn 500 XP", "🎓", "total_xp", 500),
]
