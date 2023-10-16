

import { INSTANCE } from "./cad"

const main = async function() {

    await INSTANCE.init();
    await INSTANCE.run();

}

main();
