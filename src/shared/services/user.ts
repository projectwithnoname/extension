//this is a temp function only used to test the endpoints and auth.
import { WEBSITE_ORIGIN } from "../auth"

export async function getMyData() {
    try {

        const request = await fetch(`${WEBSITE_ORIGIN}/api/users`)
        const response = await request.json();

        if(!request.ok) {
            throw new Error(`${request.status}`);
        }

        return response

    } catch(error) {
        console.error(error)
        throw error;
    }
}