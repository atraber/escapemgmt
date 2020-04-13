package main

import (
	"flag"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	log "github.com/google/logger"
	minio "github.com/minio/minio-go/v6"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/drive/v3"
)

var (
	dbName            = flag.String("db_name", "", "Database name.")
	dbUsername        = flag.String("db_username", "", "Database username.")
	dbPassword        = flag.String("db_password", "", "Database password.")
	dbHost            = flag.String("db_host", "", "Database hostname.")
	dbPort            = flag.Int("db_port", 5432, "Database port.")
	s3Endpoint        = flag.String("s3_endpoint", "", "S3 endpoint hostname.")
	s3AccessKey       = flag.String("s3_access_key", "", "S3 Access Key.")
	s3SecretKey       = flag.String("s3_secret_key", "", "S3 Secret Key.")
	s3UseSSL          = flag.Bool("s3_use_ssl", false, "S3 connection uses SSL.")
	s3Bucket          = flag.String("s3_bucket", "", "S3 Bucket Name.")
	googleCredentials = flag.String("google_credentials", "", "Google Credentials in JSON format.")
	googleDriveFolder = flag.String("google_drive_folder", "", "Google Drive Folder Shared with Service Account.")
)

func pgDumpBuildArgs(dbName string, dbUsername string, dbPassword string, dbHost string, dbPort int) []string {
	var args []string
	args = append(args, "--create")
	if dbName != "" {
		args = append(args, "--dbname="+dbName)
	}
	if dbUsername != "" {
		args = append(args, "--username="+dbUsername)
	}
	if dbPassword == "" {
		args = append(args, "--no-password")
	}
	if dbHost != "" {
		args = append(args, "--host="+dbHost)
		args = append(args, fmt.Sprintf("--port=%d", dbPort))
	}
	return args
}

func performBackup() (string, error) {
	command := "pg_dump"
	args := pgDumpBuildArgs(*dbName, *dbUsername, *dbPassword, *dbHost, *dbPort)
	cmd := exec.Command(command, args...)
	cmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", *dbPassword))
	log.Infof("Command: %s %s", command, args)
	log.Infof("Running backup command and waiting for it to finish...")
	out, err := cmd.CombinedOutput()
	if err != nil {
		log.Infof("Command finished with error: %v", err)
		log.Infof("Output: %v", string(out))
		return "", fmt.Errorf("command failed: %v", err)
	}
	log.Infof("Backup finished")
	return string(out), nil
}

func gDriveBackup(credentials string, folderId string, name string, content string) error {
	config, err := google.JWTConfigFromJSON([]byte(credentials), drive.DriveFileScope)
	if err != nil {
		return fmt.Errorf("could not create config from credentials: %v", err)
	}
	client := config.Client(oauth2.NoContext)
	service, err := drive.New(client)
	if err != nil {
		return fmt.Errorf("could not create drive client: %v", err)
	}

	f := &drive.File{
		MimeType: "text/plain",
		Name:     name,
		Parents:  []string{folderId},
	}
	file, err := service.Files.Create(f).Media(strings.NewReader(content)).Do()
	if err != nil {
		log.Infof("Could not create file: %v", err)
		return err
	}
	log.Infof("File: %+v", file)

	log.Infof("Successfully created %s on Google Drive", name)
	return nil
}

func s3Backup(s3Endpoint string, s3AccessKey string, s3SecretKey string, s3UseSSL bool, s3Bucket string, name string, content string) error {
	client, err := minio.New(s3Endpoint, s3AccessKey, s3SecretKey, s3UseSSL)
	if err != nil {
		return fmt.Errorf("could not open client: %v", err)
	}

	exists, err := client.BucketExists(s3Bucket)
	if err != nil {
		return fmt.Errorf("could not check if bucket exists: %v", err)
	}

	if !exists {
		log.Infof("Bucket doesn't exist yet. Creting bucket %s now.", s3Bucket)
		err = client.MakeBucket(s3Bucket, "")
		if err != nil {
			return fmt.Errorf("could not create bucket %s: %v", s3Bucket, err)
		}
	}

	_, err = client.PutObject(s3Bucket, name, strings.NewReader(content), int64(len(content)), minio.PutObjectOptions{})
	if err != nil {
		return fmt.Errorf("could not upload file: %v", err)
	}

	log.Infof("Successfully created %s on %s", name, s3Endpoint)
	return nil
}

func main() {
	defer log.Init("all", false, false, os.Stderr).Close()
	flag.Parse()

	if *dbName == "" {
		log.Fatal("db_name must be set")
	}

	startTime := time.Now()
	name := fmt.Sprintf("sql-backup_%s.sql", startTime.Format("1985-04-12T23:20:50.52Z"))

	content, err := performBackup()
	if err != nil {
		log.Fatalf("Failed to perform backup: %v", err)
	}

	if *s3Endpoint != "" {
		log.Info("S3 endpoint is set. Sending backup to S3 bucket.")
		err := s3Backup(*s3Endpoint, *s3AccessKey, *s3SecretKey, *s3UseSSL, *s3Bucket, name, content)
		if err != nil {
			log.Fatalf("Could not send backup to S3 bucket: %v", err)
		}
	}

	if *googleCredentials != "" {
		log.Info("Google credentials are set. Sending backup to Google Drive.")
		err := gDriveBackup(*googleCredentials, *googleDriveFolder, name, content)
		if err != nil {
			log.Fatalf("Could not send backup to Google Drive: %v", err)
		}
	}
	log.Info("Backup finished successfully")
}
