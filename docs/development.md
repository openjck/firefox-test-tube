# Run

From the project root, run `docker-compose up`

# Working with Test Tube

## Using production data locally

It can be useful to use production data locally. To do this, make a backup of
the production data on Heroku, download the backup, and import it into the
Docker container's database.

1. Download a new backup of the production site.
    1. Navigate to your local clone of the project
    2. Run `heroku pg:backups:capture --remote prod`
    3. Run `heroku pg:backups:download --remote prod -o latest.dump b001` (where
    `b001` is the identifier that appeared in the previous command)
3. Import the database
    1. Run `make shell`
    2. Run `pg_restore -h db -U postgres -d postgres --clean latest.dump`

## Use Test Tube outside of Mozilla

To run Test Tube outside of Mozilla, be sure to disable authentication or obtain
your own private keys.
