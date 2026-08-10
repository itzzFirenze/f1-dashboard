import java.net.URI;
import java.io.InputStream;
import java.net.URL;
import java.util.Scanner;
import java.net.HttpURLConnection;

public class TestOpenF1 {
    public static void main(String[] args) {
        try {
            String urlString = "https://api.openf1.org/v1/location?session_key=9472&date%3E%3D=2024-03-02T15:00:00.000Z";
            URI uri = URI.create(urlString);
            System.out.println("URI created successfully: " + uri);
            
            URL url = uri.toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.connect();
            
            int responseCode = conn.getResponseCode();
            System.out.println("Response Code: " + responseCode);
            
            if (responseCode == 200) {
                try (Scanner scanner = new Scanner(conn.getInputStream())) {
                    System.out.println("Response: " + scanner.nextLine().substring(0, 100));
                }
            } else {
                try (Scanner scanner = new Scanner(conn.getErrorStream())) {
                    System.out.println("Error: " + scanner.nextLine());
                }
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
