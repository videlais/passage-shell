# author: Dan Cox
# theme: white

-> Choice

=== Choice ===
He turned to me. "What should we eat?"
* Pizza?
    -> DONE
* Sushi?
    -> DONE
* Salad?
    -> Forbidden
* Nothing?
    What? No, we have to pick something!
    -> Choice

=== Forbidden ===
# CLEAR
A voice echoes from the heavens. "NO. SALAD IS FORBIDDEN!"
-> END
