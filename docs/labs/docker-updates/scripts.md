---
title: Scripts
description: The seven scripts and the configuration files of the Docker update setup, in full, with what each one is for.
---

# Scripts

Copy these files into your repository, at the paths in their titles. Each block opens with a click, and the button at its top right copies the whole file.

The seven scripts are general: they read the names of your servers from the stack maps or, for `backup_stacks.py`, from its config, and they hold no names of their own. Each one explains itself at the top of the file. They need Python 3.9 or later and bash, and `backup_stacks.py` also needs restic.

## The scripts

### split_stacks.py

Splits the large compose file into one folder per stack, moves secret values into variables, and writes the secrets file. It also removes a moved stack from the large file and prints the Environment text of a Komodo Stack.

- When: in [Move the stacks](move-stacks.md), once for each stack, and later when a key becomes secret.
- Reads: `tools/stacks/<server>.json` and `tools/pins/<server>.json` (examples below).
- Example: `python3 -I tools/split_stacks.py --server server-a --compose /home/docker-compose.yml --out server-a --secrets-file /root/secrets-server-a.env`
- Output: `N stack files written, M already migrated and kept`. Messages never hold a secret value.
- Exit codes: 0 done, 1 error, 2 wrong arguments.

??? example "tools/split_stacks.py"

    ```python
    #!/usr/bin/env python3
    """Split one large compose file into one compose file per stack.

    Many homelabs start with one big docker-compose.yml that holds every
    service, live ones next to commented-out ones. This tool reads that file
    and writes one folder per stack, each with its own docker-compose.yml, so
    that a tool such as Komodo can deploy each stack on its own from Git.

    It runs on the server that owns the compose file, so the real values stay
    on that server. It reads the file line by line and by indentation, not with
    a YAML library, so the stack files keep the formatting and the comments of
    the original. Commented-out services stay out of the stack files.

    Files
    -----
    tools/stacks/SERVER.json   The stack map of one server (required).
    tools/pins/SERVER.json     The exact image of each service (split only).

    SERVER is the value of --server. It may hold letters, digits, - and _, and
    it must start with a letter or a digit. Any server with a map file works.

    The stack map, for example tools/stacks/server-a.json:

        {
          "stacks": {"proxy": ["swag"], "media": ["sonarr", "sonarr-db"]},
          "skip": ["komodo-core", "komodo-mongo", "komodo-periphery"],
          "secret_keys": ["DB_PASSWORD", "API_TOKEN"],
          "secret_flags": ["--requirepass"],
          "scan_exempt_keys": ["POSTGRES_USER"],
          "plain_env": {"TZ": "Etc/UTC", "PUID": "1000", "PGID": "1000"},
          "network": {"key": "lab.docker", "name": "home_lab.docker"}
        }

      stacks            Stack name -> its services. Each live service of the
                        compose file must be in exactly one stack or in skip.
                        A service that needs another one (depends_on, links)
                        must be in the same stack.
      skip              Services that stay out of every stack, for example
                        Komodo itself.
      secret_keys       Environment keys whose values are secrets. Each value
                        moves to a variable such as ${SONARR_DB_PASSWORD}, and
                        the real value goes to the secrets file.
      secret_flags      Command-line flags whose values are secrets, for
                        example redis-server --requirepass.
      scan_exempt_keys  Secret keys whose values also appear as normal text,
                        such as a database user named like its service. The
                        leak scan skips them.
      plain_env         Values that are not secret but that the stack files
                        use as variables. --print-env writes them in clear.
      network           The external Docker network that the services join:
                        "key" is the name under networks: in the services, and
                        "name" is the real network name. A map without it
                        works only if no service uses a network.

    The pins, for example tools/pins/server-a.json, give each service its
    exact image, with tag and digest:

        {"sonarr": "lscr.io/linuxserver/sonarr:4.0.15@sha256:<64 hex digits>"}

    Modes
    -----
    Split the compose file into stack folders under OUT, and write the secrets
    to the secrets file:

        split_stacks.py --server server-a --compose /home/docker-compose.yml         --out server-a --secrets-file /root/secrets-server-a.env

        It prints "N stack files written, M already migrated and kept". A stack
        whose services are no longer in the compose file is kept as it is. If
        a key became secret after the move, its value moves to a variable in the
        kept file too, and the line ends with ", K of them with new secrets".
        A run on the same input writes the same files.

    Print the compose file without one stack, after that stack runs from its
    own folder:

        split_stacks.py --server server-a --compose /home/docker-compose.yml         --remove media > /home/docker-compose.yml.new

    Print the compose file without the services in the map's skip list:

        split_stacks.py --server server-a --compose /home/docker-compose.yml         --remove skip > /home/docker-compose.yml.new

    Print the Environment text for a Komodo Stack, from a stack file written
    before. Plain values are written as NAME=value, and secrets as
    NAME='[[NAME]]', which Komodo fills from a secret Variable of that name:

        split_stacks.py --server server-a --compose /home/docker-compose.yml         --out server-a --secrets-file /root/secrets-server-a.env         --print-env media

    Exit codes: 0 done, 1 error (the message starts with "error:"), 2 wrong
    arguments.

    Safety
    ------
    - No message ever holds a secret value, because the output gets shared.
      Messages name the service, the key or the variable instead.
    - The secrets file holds NAME='value' lines and is created with mode 0600.
      Keep it on the server, out of Git, and delete it after the values are
      stored in Komodo.
    - After the split, the tool searches the output folder for every secret
      value. If it finds one, it stops with an error, and the output must not
      be committed.
    - A commented-out line that names a secret key or flag is dropped, because
      it may hold an old value that no scan would catch.
    - A volume or env_file with a relative path is an error, because the path
      would point somewhere else from the stack's own folder.
    """
    import argparse
    import json
    import os
    import re
    import sys
    import tempfile

    TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
    STACK_FILE = "docker-compose.yml"


    class SplitError(Exception):
        pass


    def _indent(line):
        return len(line) - len(line.lstrip(" "))


    def _is_comment(line):
        return line.lstrip().startswith("#")


    def _is_live(line):
        return bool(line.strip()) and not _is_comment(line)


    def _service_spans(lines):
        """Return the base indent and {service: [first line, end line]}.

        A span stops at the service's last line, so commented-out services
        between two live ones belong to neither.
        """
        start = next(
            (i for i, line in enumerate(lines) if re.match(r"services:\s*(#.*)?$", line)),
            None,
        )
        if start is None:
            raise SplitError("no top-level services: key found")

        base = None
        spans = {}
        current = None
        for i in range(start + 1, len(lines)):
            line = lines[i]
            if not line.strip():
                continue
            indent = _indent(line)
            if _is_comment(line):
                if current is not None and base is not None and indent > base:
                    current[1] = i + 1
                continue
            if indent == 0:
                break
            if base is None:
                base = indent
            if indent == base:
                match = re.match(r"([A-Za-z0-9._-]+):\s*(#.*)?$", line.strip())
                if match is None:
                    raise SplitError(f"line {i + 1}: expected a service name")
                current = spans[match.group(1)] = [i, i + 1]
            elif indent > base and current is not None:
                current[1] = i + 1
            else:
                raise SplitError(f"line {i + 1}: unexpected indentation")
        return base, spans


    def parse_services(text):
        """Return {service: its lines, without the service's own name line}."""
        lines = text.split("\n")
        base, spans = _service_spans(lines)
        services = {}
        for name, (first, end) in spans.items():
            services[name] = [
                line
                for line in lines[first + 1:end]
                if not (_is_comment(line) and _indent(line) <= base)
            ]
        return services


    def _child_indent(lines):
        live = [line for line in lines if _is_live(line)]
        return _indent(live[0]) if live else 0


    def _section(lines, key):
        """Return (text after "key:", live lines nested under it), or None."""
        live = [line for line in lines if _is_live(line)]
        child = _child_indent(lines)
        for i, line in enumerate(live):
            if _indent(line) == child and line.strip().startswith(key + ":"):
                nested = []
                for follow in live[i + 1:]:
                    is_list_item = follow.strip().startswith("- ")
                    if _indent(follow) > child or (_indent(follow) == child and is_list_item):
                        nested.append(follow)
                    else:
                        break
                return line.strip()[len(key) + 1:].strip(), nested
        return None


    def _names(lines, key):
        """Return the names under a key, in list, mapping or [flow] form."""
        section = _section(lines, key)
        if section is None:
            return []
        inline, nested = section
        if inline.startswith("["):
            return re.findall(r"[\w.-]+", inline.split("#")[0])
        if not nested:
            return []
        depth = min(_indent(line) for line in nested)
        names = []
        for line in nested:
            if _indent(line) == depth:
                match = re.match(r"(?:-\s+)?[\"']?([\w.-]+)", line.strip())
                if match:
                    names.append(match.group(1))
        return names


    def validate_map(services, stack_map):
        skip = set(stack_map.get("skip", []))
        owner = {}
        for stack, names in stack_map["stacks"].items():
            for name in names:
                if name in owner or name in skip:
                    raise SplitError(f"service {name} is listed more than once in the map")
                owner[name] = stack

        for name, lines in services.items():
            if name in skip:
                continue
            if name not in owner:
                raise SplitError(f"service {name} is not in any stack")
            for key in ("depends_on", "links"):
                for other in _names(lines, key):
                    if owner.get(other) != owner[name]:
                        raise SplitError(
                            f"{name} (stack {owner[name]}) needs {other} "
                            f"(stack {owner.get(other, 'none')}) through {key}"
                        )


    def pin_image(lines, ref):
        child = _child_indent(lines)
        pinned = []
        found = False
        for line in lines:
            if _is_live(line) and _indent(line) == child and line.strip().startswith("image:"):
                pinned.append(" " * child + "image: " + ref)
                found = True
            else:
                pinned.append(line)
        if not found:
            raise SplitError("service has no live image: line")
        return pinned


    def _scalar(raw, where):
        """Return the string that a one-line YAML scalar holds.

        Handles plain, 'single-quoted' and "double-quoted" values and strips a
        trailing # comment. Anything this parser cannot read with certainty,
        such as a multi-line value, is an error instead of a guess.
        """
        raw = raw.strip()
        if raw[:1] == '"':
            match = re.match(r'"(?:[^"\\]|\\.)*"', raw)
            if match is None:
                raise SplitError(f"{where}: unclosed double quote")
            try:
                value = json.loads(match.group(0))
            except ValueError:
                raise SplitError(f"{where}: unsupported escape sequence") from None
        elif raw[:1] == "'":
            match = re.match(r"'(?:[^']|'')*'", raw)
            if match is None:
                raise SplitError(f"{where}: unclosed single quote")
            value = match.group(0)[1:-1].replace("''", "'")
        elif raw[:1] in ("|", ">"):
            raise SplitError(f"{where}: multi-line values are not supported")
        else:
            return re.split(r"(?:^|\s+)#", raw, maxsplit=1)[0]

        rest = raw[match.end():].strip()
        if rest and not rest.startswith("#"):
            raise SplitError(f"{where}: unexpected text after the closing quote")
        return value


    def _compose_value(value, where):
        """Undo compose escaping. Return None if there is nothing to extract.

        In a compose file, $$ is a literal $. An empty value or one that is
        already a ${VARIABLE} needs no work. A value that mixes text with a
        variable cannot move to an env file as one value, so it is an error.
        """
        if not value or re.fullmatch(r"\$\{[^}]*\}", value):
            return None
        if "$" in value.replace("$$", ""):
            raise SplitError(f"{where}: value mixes text with a variable or a bare $")
        if "\n" in value:
            raise SplitError(f"{where}: multi-line values are not supported")
        if value.endswith("\\") or "\\'" in value:
            raise SplitError(f"{where}: Compose cannot read this backslash from an env file")
        return value.replace("$$", "$")


    def _variable(service, key):
        """Name the variable for a secret: service web, key DB_PASSWORD -> WEB_DB_PASSWORD."""
        return re.sub(r"[^A-Za-z0-9]", "_", f"{service}_{key}").upper()


    def _extract_flag(service, line, flag, found):
        """Move the value after a flag on a plain command: line to a variable."""
        where = f"{service} {flag}"
        match = re.match(
            rf"(\s*command:\s+[^\s\"'\[].*?{re.escape(flag)}[ =])(\S+)(.*)$", line
        )
        if match is None:
            raise SplitError(f"{where}: only a plain command: line is supported")
        token = match.group(2)
        if re.fullmatch(r'"\$\{[^}]*\}"', token):
            return line
        if re.search(r"[\"'\\]", token):
            raise SplitError(f"{where}: value has a quote or a backslash")
        value = _compose_value(token, where)
        if value is None:
            return line
        variable = _variable(service, flag.lstrip("-"))
        found[variable] = value
        return f'{match.group(1)}"${{{variable}}}"{match.group(3)}'


    def extract_secrets(service, lines, keys, flags=()):
        """Replace secret values with variables.

        Returns the new lines and {variable: real value}. A commented-out
        line that names a secret key or flag is dropped, because it may hold
        an old value and no scan would catch that.
        """
        result = []
        found = {}
        for line in lines:
            if _is_comment(line):
                match = re.match(r"\s*#+\s*(?:-\s*)?[\"']?([\w.-]+)[\"']?\s*[:=]", line)
                named = match and match.group(1) in keys
                if not named and not any(flag in line for flag in flags):
                    result.append(line)
                continue

            for flag in flags:
                if flag in line:
                    line = _extract_flag(service, line, flag, found)

            mapping = re.match(r"(\s*)([\"']?)([\w.-]+)\2:(?:\s+(.*))?$", line)
            listed = re.match(r"(\s*-\s+)([\"']?)([\w.-]+)=", line)
            if mapping and mapping.group(3) in keys:
                key = mapping.group(3)
                where = f"{service} {key}"
                value = _compose_value(_scalar(mapping.group(4) or "", where), where)
                if value is not None:
                    variable = _variable(service, key)
                    found[variable] = value
                    line = f'{mapping.group(1)}{key}: "${{{variable}}}"'
            elif listed and listed.group(3) in keys:
                key = listed.group(3)
                where = f"{service} {key}"
                item = _scalar(line[listed.end(1):], where)
                value = _compose_value(item.split("=", 1)[1], where)
                if value is not None:
                    variable = _variable(service, key)
                    found[variable] = value
                    line = f"{listed.group(1)}{key}=${{{variable}}}"
            result.append(line)
        return result, found


    def render_stack(stack, blocks, network):
        """Return the text of one stack file.

        network is the map's {"key": ..., "name": ...}, or None. The key is the
        name that the services use under networks:, and the name is the real
        Docker network, which already exists, so the stack declares it external.
        """
        out = [f"name: {stack}", "services:"]
        uses_network = False
        for i, (name, lines) in enumerate(blocks.items()):
            if i:
                out.append("")
            out.append(f"  {name}:")
            out.extend(lines)
            for used in _names(lines, "networks"):
                if network is None:
                    raise SplitError(f"map has no network, but {name} uses {used}")
                if used != network["key"]:
                    raise SplitError(f"{name} uses unknown network {used}")
                uses_network = True
        if uses_network:
            out += ["", "networks:", f"  {network['key']}:", "    external: true", f"    name: {network['name']}"]
        return "\n".join(out) + "\n"


    def remove_services(text, names):
        lines = text.split("\n")
        _, spans = _service_spans(lines)
        dropped = set()
        for name in names:
            if name not in spans:
                raise SplitError(f"service {name} is not in the compose file")
            dropped.update(range(*spans[name]))
        return "\n".join(line for i, line in enumerate(lines) if i not in dropped)


    def scan_for_values(root, values):
        """Return the files under root that contain any of the values."""
        wanted = [value for value in values if value]
        hits = []
        for folder, dirs, files in os.walk(root):
            dirs.sort()
            for name in sorted(files):
                path = os.path.join(folder, name)
                with open(path, encoding="utf-8", errors="ignore") as f:
                    text = f.read()
                if any(value in text for value in wanted):
                    hits.append(path)
        return hits


    def _check_paths(service, lines):
        """Relative paths would point somewhere new from the stack's folder."""
        for key in ("volumes", "env_file"):
            section = _section(lines, key)
            if section is None:
                continue
            for entry in [section[0], *section[1]]:
                path = re.sub(r"^\s*(?:-\s+)?[\"']?", "", entry)
                if path.startswith(("./", "../", "~")):
                    raise SplitError(f"{service} has a relative path under {key}")


    def _read_secrets(path):
        if not os.path.exists(path):
            return {}
        with open(path, encoding="utf-8") as f:
            text = f.read()
        secrets = {}
        for line in text.split("\n"):
            if line:
                name, _, quoted = line.partition("=")
                secrets[name] = quoted[1:-1].replace("\\'", "'")
        return secrets


    def _write_secrets(path, secrets):
        # Compose reads \' inside single quotes. Shell-style '\'' fails.
        body = "".join(
            "{}='{}'\n".format(name, secrets[name].replace("'", "\\'"))
            for name in sorted(secrets)
        )
        # mkstemp creates the file as 0600.
        fd, temp = tempfile.mkstemp(dir=os.path.dirname(os.path.abspath(path)))
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
            f.write(body)
        os.replace(temp, path)


    def _existing_services(stack, path, names, present):
        """Return the services in a moved stack's file, so others can join it.

        The file and the compose file together must hold each service of the
        stack exactly once.
        """
        existing = {}
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                existing = parse_services(f.read())
        for name in existing:
            if name not in names:
                raise SplitError(f"stack {stack} file holds {name}, which the map does not list for it")
            if name in present:
                raise SplitError(f"stack {stack} already holds {name}, which is also in the compose file")
        missing = [name for name in names if name not in present and name not in existing]
        if missing:
            raise SplitError(f"stack {stack} is only partly in the compose file: {', '.join(missing)} missing")
        return existing


    def _extract_in_file(text, keys, flags):
        """Apply extract_secrets to each service in a moved stack's file.

        A key that became secret after the move gets its variable here. Other
        lines stay as they are, so a change by Renovate survives.
        """
        lines = text.split("\n")
        _, spans = _service_spans(lines)
        found = {}
        # From the end, so that a shorter service does not move the next span.
        for name, (first, end) in sorted(spans.items(), key=lambda item: -item[1][0]):
            lines[first + 1:end], more = extract_secrets(name, lines[first + 1:end], keys, flags)
            found.update(more)
        return "\n".join(lines), found


    def split_compose(text, stack_map, pins, out_dir, secrets_file):
        """Write the stack files and secrets file.

        Return (written, kept, updated): updated counts the kept stacks whose
        file changed because a key became secret after the move.
        """
        services = parse_services(text)
        validate_map(services, stack_map)

        secrets = _read_secrets(secrets_file)
        keys = stack_map.get("secret_keys", [])
        flags = stack_map.get("secret_flags", [])
        rendered = {}
        kept = []
        updated = 0
        for stack, names in stack_map["stacks"].items():
            path = os.path.join(out_dir, stack, STACK_FILE)
            present = [name for name in names if name in services]
            if not present:
                if not os.path.exists(path):
                    raise SplitError(f"stack {stack} has no services and no existing file")
                kept.append(stack)
                with open(path, encoding="utf-8") as f:
                    old = f.read()
                new, found = _extract_in_file(old, keys, flags)
                secrets.update(found)
                if new != old:
                    rendered[path] = new
                    updated += 1
                continue
            existing = {}
            if len(present) != len(names):
                existing = _existing_services(stack, path, names, present)

            blocks = {}
            for name in names:
                if name in existing:
                    blocks[name], found = extract_secrets(name, existing[name], keys, flags)
                    secrets.update(found)
                    continue
                if name not in pins:
                    raise SplitError(f"no pin for service {name}")
                _check_paths(name, services[name])
                try:
                    lines = pin_image(services[name], pins[name])
                except SplitError as error:
                    raise SplitError(f"{name}: {error}") from None
                blocks[name], found = extract_secrets(name, lines, keys, flags)
                secrets.update(found)
            rendered[path] = render_stack(stack, blocks, stack_map.get("network"))

        for path, body in rendered.items():
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8", newline="\n") as f:
                f.write(body)
        _write_secrets(secrets_file, secrets)

        # Some secrets, such as a database username, match a service name or
        # a path, so the scan cannot tell a leak from a normal line.
        exempt = {
            _variable(service, key)
            for names in stack_map["stacks"].values()
            for service in names
            for key in stack_map.get("scan_exempt_keys", [])
        }
        leaks = {}
        for name, value in secrets.items():
            hits = [] if name in exempt else scan_for_values(out_dir, [value])
            if hits:
                leaks[name] = hits
        if leaks:
            detail = "; ".join(f"{name} in {', '.join(hits)}" for name, hits in sorted(leaks.items()))
            raise SplitError(f"secret values found in the output, do not commit it: {detail}")
        return len(rendered) - updated, len(kept), updated


    def stack_environment(text, plain, secret_names):
        """Return the text for a Komodo Stack's Environment field.

        Single quotes make Compose read a secret literally, so a $ stays a $.
        """
        live = "\n".join(line for line in text.split("\n") if _is_live(line))
        names = sorted(set(re.findall(r"\$\{([A-Za-z0-9_]+)\}", live)))
        unknown = [name for name in names if name not in plain and name not in secret_names]
        if unknown:
            raise SplitError(f"variable {unknown[0]} is not plain or a secret")
        lines = [f"{name}={plain[name]}" for name in names if name in plain]
        lines += [f"{name}='[[{name}]]'" for name in names if name not in plain]
        return "".join(line + "\n" for line in lines)


    def _load_json(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)


    def server_name(value):
        """argparse type for --server: a plain name, so the map path stays in tools/stacks."""
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", value):
            raise argparse.ArgumentTypeError(
                f"server name must start with a letter or digit and hold only letters, digits, - and _: {value!r}"
            )
        return value


    def main(argv=None, tools_dir=TOOLS_DIR):
        parser = argparse.ArgumentParser(
            description="Split one large compose file into one compose file per stack. "
            "Read the top of this file for the map format and examples."
        )
        parser.add_argument(
            "--server",
            required=True,
            type=server_name,
            help="the server whose map tools/stacks/SERVER.json and pins tools/pins/SERVER.json are used",
        )
        parser.add_argument("--compose", required=True, help="the large compose file to read")
        parser.add_argument("--out", help="folder for the stack folders, usually the server's folder in the repository")
        parser.add_argument("--secrets-file", help="file for the secret values, kept on the server and out of Git")
        parser.add_argument(
            "--remove",
            metavar="STACK",
            help="print the compose file without STACK, or without the map's skip list for 'skip'",
        )
        parser.add_argument(
            "--print-env",
            metavar="STACK",
            help="print the Komodo Environment text for a generated stack",
        )
        args = parser.parse_args(argv)
        if not args.remove and not (args.out and args.secrets_file):
            parser.error("--out and --secrets-file are required unless --remove is given")

        try:
            with open(args.compose, encoding="utf-8") as f:
                text = f.read()
            map_path = os.path.join(tools_dir, "stacks", f"{args.server}.json")
            if not os.path.exists(map_path):
                raise SplitError(f"no stack map tools/stacks/{args.server}.json")
            stack_map = _load_json(map_path)
            if args.remove == "skip":
                sys.stdout.write(remove_services(text, stack_map["skip"]))
            elif args.remove:
                if args.remove not in stack_map["stacks"]:
                    raise SplitError(f"stack {args.remove} is not in the map")
                # Services that already joined a moved stack are gone from the file.
                services = parse_services(text)
                present = [name for name in stack_map["stacks"][args.remove] if name in services]
                if not present:
                    raise SplitError(f"stack {args.remove} has no services in the compose file")
                sys.stdout.write(remove_services(text, present))
            elif args.print_env:
                with open(os.path.join(args.out, args.print_env, STACK_FILE), encoding="utf-8") as f:
                    stack_text = f.read()
                sys.stdout.write(
                    stack_environment(
                        stack_text, stack_map.get("plain_env", {}), _read_secrets(args.secrets_file)
                    )
                )
            else:
                pins = _load_json(os.path.join(tools_dir, "pins", f"{args.server}.json"))
                written, kept, updated = split_compose(text, stack_map, pins, args.out, args.secrets_file)
                note = f", {updated} of them with new secrets" if updated else ""
                print(f"{written} stack files written, {kept} already migrated and kept{note}")
        except (SplitError, OSError, ValueError) as error:
            print(f"error: {error}", file=sys.stderr)
            return 1
        return 0


    if __name__ == "__main__":
        sys.exit(main())
    ```

### check_images.py

Compares the image of each container on a server with the image in its stack files and its `komodo_files`, and lists containers that no file describes. It only reads.

- When: after each merge for a critical stack, after a reboot, and whenever you want proof. See [Daily use](daily-use.md#find-an-update-that-did-not-deploy).
- Example: `python3 -I tools/check_images.py server-a`
- Output: only the problems (`DIFFERENT`, `MISSING`, `NOT RUNNING`, `NOT IN ANY FILE`), then `N of M containers run the image from the repo`.
- Exit codes: 0 all match, 1 a problem, 2 wrong arguments or no stack map.

??? example "tools/check_images.py"

    ```python
    #!/usr/bin/env python3
    """Compare the image that each container runs with the image that the repo
    asks for, on one server.

    Why
    ---
    With a GitOps setup, the stack files in Git say which image each service
    runs. Most stacks deploy by themselves after a merge, but some (a reverse
    proxy, the Git server itself) wait for a click on Deploy. If you forget the
    click, the server keeps running the old image, and nothing tells you. This
    tool finds that, and it also finds containers that are stopped, missing,
    or not described by any file.

    It only reads. It runs `docker inspect` and `docker ps`, prints container
    names and image references, and changes nothing.

    Usage
    -----
    Run it on the server, in its clone of the repository, after a pull:

        cd /root/<your-repo> && git pull && python3 -I tools/check_images.py server-a

    SERVER is the name of a folder in the repository root that holds one
    folder per stack (server-a/<stack>/docker-compose.yml), and of its stack
    map tools/stacks/SERVER.json. Containers that run outside those stacks,
    such as Komodo itself, are listed in the map:

        "komodo_files": ["komodo/docker-compose.yml"]

    Paths in komodo_files are relative to the repository root. A map without
    komodo_files checks only the stack folders.

    How it matches
    --------------
    A service matches the container with its container_name, or, without one,
    the container with the service's name. Docker shows images from Docker Hub
    with docker.io/ or docker.io/library/ in front, so those prefixes do not
    count as a difference.

    Output
    ------
    Only problems are printed, then a summary:

        DIFFERENT: <stack>/<container>       The container runs another image.
          repo:    <image in the file>       Click Deploy on that stack.
          running: <image it runs>
        MISSING: <stack>/<container>         No such container. Read the log
                                             of the stack's last deploy.
        NOT RUNNING: <stack>/<container>     It exists but is stopped, exited
                                             or restarting. Read its log.
        N of M containers run the image from the repo
        NOT IN ANY FILE: <container>         A container that no file
                                             describes. Find out who started it.

    When all is well, the only line is "M of M containers run the image from
    the repo".

    Exit codes: 0 all match and no extra container, 1 a problem was found,
    2 wrong arguments or no stack map for the server.
    """
    import glob
    import json
    import os
    import re
    import subprocess
    import sys

    REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    SERVER_NAME = re.compile(r"[A-Za-z0-9][A-Za-z0-9_-]*")


    class UsageError(Exception):
        pass


    def services(path):
        """Yield (stack, service, container_name, image) from one compose file.

        It reads by line and indentation: services at two spaces, their keys at
        four. Commented-out lines are ignored. The stack is the name of the
        folder that holds the file.
        """
        with open(path, encoding="utf-8") as f:
            lines = f.read().replace("\r\n", "\n").split("\n")
        stack = os.path.basename(os.path.dirname(path))
        in_services = False
        current = None
        found = {}
        for line in lines:
            if re.match(r"^services:\s*$", line):
                in_services = True
                continue
            if re.match(r"^\S", line):
                in_services = False
                current = None
                continue
            if not in_services or re.match(r"^\s*#", line):
                continue
            name = re.match(r"^  ([A-Za-z0-9_.-]+):\s*$", line)
            if name:
                current = name.group(1)
                found[current] = {"container": current, "image": None}
                continue
            if current is None:
                continue
            image = re.match(r"^    image:\s*['\"]?([^'\"\s#]+)", line)
            if image:
                found[current]["image"] = image.group(1)
            container = re.match(r"^    container_name:\s*['\"]?([^'\"\s#]+)", line)
            if container:
                found[current]["container"] = container.group(1)
        for service, item in found.items():
            yield stack, service, item["container"], item["image"]


    def normalize(ref):
        """docker.io/library/ and docker.io/ are what Docker adds by itself."""
        ref = ref or ""
        for prefix in ("docker.io/library/", "docker.io/"):
            if ref.startswith(prefix):
                ref = ref[len(prefix):]
        return ref


    def komodo_files(server, root):
        """Return the absolute paths of the map's komodo_files, or []."""
        path = os.path.join(root, "tools", "stacks", f"{server}.json")
        if not os.path.exists(path):
            raise UsageError(f"no stack map tools/stacks/{server}.json")
        with open(path, encoding="utf-8") as f:
            stack_map = json.load(f)
        return [os.path.join(root, item) for item in stack_map.get("komodo_files", [])]


    def docker_inspect(name):
        """Return (image, state) of one container, or None if it does not exist."""
        result = subprocess.run(
            ["docker", "inspect", "--format", "{{.Config.Image}} {{.State.Status}}", name],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            return None
        image, _, state = result.stdout.strip().partition(" ")
        return image, state


    def docker_names():
        """Return the names of all containers, running or not."""
        result = subprocess.run(["docker", "ps", "-a", "--format", "{{.Names}}"], capture_output=True, text=True)
        return result.stdout.split()


    def check(server, root, inspect, names):
        """Print the problems and the summary. Return the exit code.

        inspect and names stand in for Docker, so tests can pass fakes.
        """
        files = sorted(glob.glob(os.path.join(root, server, "*", "docker-compose.yml")))
        files += komodo_files(server, root)
        expected = set()
        rows = []
        for path in files:
            for stack, _service, container, image in services(path):
                expected.add(container)
                found = inspect(container)
                if found is None:
                    rows.append(("MISSING", stack, container, image, "-"))
                    continue
                running, state = found
                if normalize(running) != normalize(image):
                    rows.append(("DIFFERENT", stack, container, image, running))
                elif state != "running":
                    rows.append(("NOT RUNNING", stack, container, image, state))
                else:
                    rows.append(("same", stack, container, image, running))
        extra = sorted(set(names()) - expected)

        for status, stack, container, image, running in rows:
            if status != "same":
                print(f"{status}: {stack}/{container}")
                print(f"  repo:    {image}")
                print(f"  running: {running}")
        same = sum(1 for row in rows if row[0] == "same")
        print(f"{same} of {len(rows)} containers run the image from the repo")
        for name in extra:
            print(f"NOT IN ANY FILE: {name}")
        return 0 if same == len(rows) and not extra else 1


    def main(argv=None, root=REPO, inspect=docker_inspect, names=docker_names):
        argv = sys.argv[1:] if argv is None else argv
        try:
            if len(argv) != 1 or not SERVER_NAME.fullmatch(argv[0]):
                raise UsageError("give one server name of letters, digits, - and _")
            return check(argv[0], root, inspect, names)
        except UsageError as error:
            print("usage: check_images.py SERVER", file=sys.stderr)
            print(f"error: {error}", file=sys.stderr)
            return 2


    if __name__ == "__main__":
        sys.exit(main())
    ```

### collect_state.sh

Records every container with its configured image, image ID, digests, project, start time and a hash of its environment. Two records compared field by field prove what a change did. It prints no environment value.

- When: before and after each move, merge or reboot. See [Back up and record](backup.md#record-what-runs).
- Example: `bash tools/collect_state.sh > work/before.txt`

??? example "tools/collect_state.sh"

    ```bash
    #!/usr/bin/env bash
    # collect_state.sh: record every container and the exact image it runs.
    #
    # Why: before and after a change (a move to Komodo, a merged update, a
    # reboot), two records show what really changed: which container got a new
    # image, which one restarted, and whether its environment stayed the same.
    #
    # Usage, on the server, as root or as a user in the docker group:
    #
    #   mkdir -p work
    #   bash tools/collect_state.sh > work/before.txt
    #   ... make the change ...
    #   bash tools/collect_state.sh > work/after.txt
    #
    # Output: one line per container, sorted by name, with fields split by |:
    #
    #   1 container name       5 version label (org.opencontainers.image.version)
    #   2 configured image     6 compose project
    #   3 image id             7 compose file(s)
    #   4 repo digests         8 start time
    #                          9 env hash
    #
    # For example:
    #
    #   web|ghcr.io/example/web:2.0@sha256:<digest>|sha256:<id>|ghcr.io/example/web@sha256:<digest>|2.0|app|/srv/repo/server-a/app/docker-compose.yml|2026-01-01T10:00:00Z|3f2a9c0d1e2b4a56
    #
    # To compare two records field by field (here the configured image, the
    # image id and the start time), keep the name in field 1:
    #
    #   for f in 2 3 8; do diff <(cut -d'|' -f1,$f work/before.txt) <(cut -d'|' -f1,$f work/after.txt); echo "field $f done"; done
    #
    # Field 4 is empty for a container whose tag moved to a newer image after
    # it started, so the image id in field 3 is the only proof of what it runs.
    # The env hash is the first 16 hex digits of a SHA-256 over the sorted
    # environment variables. It changes when a variable is added, removed or
    # changed, without showing any value.
    #
    # It only reads (docker inspect and docker image inspect) and changes
    # nothing. It prints no environment value, so the output is safe to share,
    # but it does show container names, images and file paths.

    docker ps -a --format '{{.Names}}' | sort | while read -r name; do
      id=$(docker inspect --format '{{.Image}}' "$name")
      digests=$(docker image inspect --format '{{join .RepoDigests ","}}' "$id" 2>/dev/null)
      version=$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.version"}}' "$id" 2>/dev/null)
      details=$(docker inspect --format '{{.Config.Image}}|{{index .Config.Labels "com.docker.compose.project"}}|{{index .Config.Labels "com.docker.compose.project.config_files"}}|{{.State.StartedAt}}' "$name")
      env_hash=$(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$name" | LC_ALL=C sort | sha256sum | cut -c1-16)
      image=${details%%|*}
      echo "$name|$image|$id|$digests|$version|${details#*|}|$env_hash"
    done
    ```

### find_literals.sh

Lists the keys of a compose file that look sensitive, as `LITERAL` (the value is in the file) or `reference` (a variable), and the long flags of commands. It prints names only.

- When: before the first split, to fill `secret_keys`, and to read each new stack file.
- Example: `bash tools/find_literals.sh < /home/docker-compose.yml`

??? example "tools/find_literals.sh"

    ```bash
    #!/usr/bin/env bash
    # find_literals.sh: list the keys of a compose file that look sensitive.
    #
    # Why: before a large compose file is split into stacks and put into Git,
    # every secret in it must move to a variable. This lists the keys whose
    # names look sensitive and says, for each, whether the file holds the
    # value itself (LITERAL) or a ${VARIABLE} (reference). The LITERAL keys
    # are the ones to add to secret_keys in the stack map.
    #
    # Usage, with the compose file on stdin:
    #
    #   bash tools/find_literals.sh < /home/docker-compose.yml
    #
    # Output: one line per hit, as "line key kind":
    #
    #   12 DB_PASSWORD LITERAL       the value is in the file
    #   13 API_TOKEN reference       the value comes from a variable
    #   40 command flags: --requirepass --appendonly
    #
    # A key counts as sensitive when its name contains one of: pass, secret,
    # token, key, webhook, discord, _url, user, auth, credential, private,
    # bearer, cookie, salt, dsn (in any case). A value with a login in a URL
    # (scheme://user:password@host) counts too, whatever the key. For
    # command:, entrypoint: and test:, it lists the long flags, so that a
    # secret flag such as --requirepass can go to secret_flags in the map.
    # Commented-out lines and keys without a value are skipped.
    #
    # It changes nothing. It prints line numbers, key names and flag names
    # only. Values never leave this script, so the output is safe to share.
    # It needs bash and awk.

    awk '
    /^[ \t]*#/ { next }
    {
      text = $0
      sub(/^[ \t]*(-[ \t]+)?["\047]?/, "", text)
      if (!match(text, /^[A-Za-z0-9_.-]+[:=]/)) next
      name = substr(text, 1, RLENGTH - 1)
      value = substr(text, RLENGTH + 1)
      if (value ~ /^[ \t]*(#.*)?$/) next

      if (name == "command" || name == "entrypoint" || name == "test") {
        flags = ""
        rest = " " value
        while (match(rest, /[ \t"\047,]--[A-Za-z][A-Za-z_-]*/)) {
          flags = flags " " substr(rest, RSTART + 1, RLENGTH - 1)
          rest = substr(rest, RSTART + RLENGTH)
        }
        print NR, name, "flags:" flags
        next
      }

      sensitive = tolower(name) ~ /pass|secret|token|key|webhook|discord|_url|user|auth|credential|private|bearer|cookie|salt|dsn/
      has_login = value ~ /:\/\/[^\/@ ]+:[^\/@ ]+@/
      if (sensitive || has_login) {
        print NR, name, (index(value, "${") ? "reference" : "LITERAL")
      }
    }
    '
    ```

### inspect-server.sh

Prints a read-only picture of a Docker host: versions, containers, networks, firewall, ports, and every compose file with its secrets masked. Host names, addresses and paths are not masked, so read the output before you share it.

- When: before you plan the move of a server you do not know well.
- Example: `bash tools/inspect-server.sh > work/inspect-server-a.txt`, or with `--check-url https://<komodo-host>/` on `server-b`.

??? example "tools/inspect-server.sh"

    ```bash
    #!/usr/bin/env bash
    # inspect-server.sh: a read-only picture of a Docker host before a migration.
    #
    # Why: before you move a server's containers into a Git repository and a
    # deployment tool, you need to know what runs there: the OS, Docker and
    # Compose versions, every container and its compose project, which
    # containers can use the Docker socket, the networks, the firewall, the open
    # ports, and every compose file with the sensitive keys in it. This script
    # prints all of that in one go, with secret values masked, so you can save
    # the output and read it (or share it) while you plan.
    #
    # Usage, on the server, as root or as a user that can use docker and read
    # the compose files:
    #
    #   bash tools/inspect-server.sh > inspect-server-a.txt
    #   bash tools/inspect-server.sh /home/docker-compose.yml /opt/other/compose.yml
    #   bash tools/inspect-server.sh --check-url https://<komodo-host>/ > inspect-server-b.txt
    #
    # Arguments:
    #
    #   COMPOSE_FILE ...   The compose files to print. Without any, the script
    #                      takes the files from the com.docker.compose.project
    #                      .config_files label of every container.
    #   --check-url URL    Also try to reach URL and print the HTTP status and
    #                      the address it reached, for example to make sure
    #                      that this server reaches a Komodo Core elsewhere.
    #
    # Sections of the output, in order: os, identity, resources, docker,
    # compose projects, containers (name|image|status|project|ports),
    # containers using the docker socket, containers on a superseded image
    # (shown by an image id instead of a name), networks, firewall (firewalld
    # or ufw), listening tcp ports, public ip (asked from 1.1.1.1), the URL
    # check if asked, git, and then one block per compose file: its size and
    # owner, the .env and override files beside it (names only), whether it is
    # in a Git repository, the sensitive-looking keys as LITERAL or reference,
    # and its contents with secrets masked. The last line is "--- end".
    #
    # Masking happens here, before any output leaves the server:
    #   - user:password@ in URLs becomes <masked>@
    #   - the value of every UPPER_CASE key in mapping form, and of every
    #     "- KEY=value" list item, becomes <masked>
    #   - --*token*, --*secret* and --*password* flag values become <masked>
    #   - a line whose key mentions pass, secret, token, apikey, auth,
    #     credential, private, bearer or cookie has its value masked
    #   - any run of 32 or more letters, digits, +, /, _ or - becomes <masked>
    #   - image: and container_name: lines and ${VARIABLE} lines stay as they are
    #
    # What is NOT masked: host names, domain names, IP addresses, user names,
    # paths and container names. Read the output before you share it, and
    # replace those by hand if they are private.
    #
    # It only reads. It changes nothing on the server. It needs bash 4 or
    # later. Missing tools (ss, firewall-cmd, ufw, curl) only leave their
    # section empty.

    check_url=""
    files=()
    while [ $# -gt 0 ]; do
      case "$1" in
        --check-url) check_url="$2"; shift 2 ;;
        -h|--help) sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) files+=("$1"); shift ;;
      esac
    done

    mask_secrets() {
      sed -E \
        -e '/^[[:space:]]*(image|container_name):/b' \
        -e 's#(://)[^/@[:space:]]+:[^/@[:space:]]+@#\1<masked>@#g' \
        -e '/\$\{[A-Za-z_]/b' \
        -e 's/^([[:space:]]*-[[:space:]]*"?[A-Za-z0-9_.]+=).*/\1<masked>/' \
        -e 's/^([[:space:]]+[A-Z][A-Z0-9_]+:[[:space:]]+).+/\1<masked>/' \
        -e 's/(--[a-z-]*(token|secret|password)[a-z-]*[= ]).*/\1<masked>/I' \
        -e '/(pass|secret|token|apikey|api_key|auth|credential|private|bearer|cookie)/I s/([:=][[:space:]]*).+/\1<masked>/' \
        -e 's/[A-Za-z0-9+\/_-]{32,}/<masked>/g'
    }

    echo "--- os"; . /etc/os-release 2>/dev/null && echo "$PRETTY_NAME"; uname -r
    echo "--- identity"; id -un; hostname
    echo "--- resources"; nproc 2>/dev/null; free -h 2>/dev/null | sed -n '2p'; df -h / | tail -1
    echo "--- docker"
    docker version --format 'server {{.Server.Version}}' 2>&1
    docker compose version 2>&1
    docker info --format 'root={{.DockerRootDir}} storage={{.Driver}} containers={{.Containers}} running={{.ContainersRunning}} images={{.Images}}' 2>&1
    echo "--- compose projects"
    docker compose ls -a 2>&1
    echo "--- containers"
    docker ps -a --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.Label "com.docker.compose.project"}}|{{.Ports}}'
    echo "--- containers using the docker socket"
    for c in $(docker ps -q); do
      docker inspect --format '{{.Name}} {{range .Mounts}}{{.Source}} {{end}}' "$c" | grep 'docker.sock' | awk '{print $1}'
    done
    echo "--- containers on a superseded image"
    docker ps --format '{{.Names}} {{.Image}}' | grep -E ' [0-9a-f]{12}$'
    echo "--- networks"
    docker network ls --format '{{.Name}} {{.Driver}} {{.Scope}}'
    echo "--- firewall"
    systemctl is-active firewalld 2>&1
    firewall-cmd --list-all 2>/dev/null | grep -E '^\S|services:|ports:'
    ufw status 2>/dev/null | head -30
    echo "--- listening tcp ports"
    ss -tln 2>/dev/null | awk 'NR>1 {print $4}' | sort -u
    echo "--- public ip"
    curl -sS -m 5 https://1.1.1.1/cdn-cgi/trace 2>/dev/null | grep '^ip='
    if [ -n "$check_url" ]; then
      echo "--- reach $check_url"
      curl -sS -m 10 -o /dev/null -w 'http=%{http_code} ip=%{remote_ip}\n' "$check_url" 2>&1
    fi
    echo "--- git"; git --version 2>&1

    if [ ${#files[@]} -eq 0 ]; then
      # Every compose file that started a container, without duplicates.
      mapfile -t files < <(docker ps -a --format '{{.Label "com.docker.compose.project.config_files"}}' \
        | tr ',' '\n' | grep -v '^$' | sort -u)
    fi
    echo "--- compose files"; printf '%s\n' "${files[@]}"

    for f in "${files[@]}"; do
      echo
      echo "=== $f"
      if [ ! -r "$f" ]; then echo "cannot read"; continue; fi
      ls -la "$f"
      d=$(dirname "$f")
      echo "--- files beside it (names only)"; ls -a "$d" | grep -E '^\.env|\.env$|compose|override'
      echo "--- git repo?"; git -C "$d" rev-parse --is-inside-work-tree 2>&1 | head -1
      echo "--- literal or reference, for sensitive-looking keys (values never shown)"
      grep -nE '(PASS|SECRET|TOKEN|APIKEY|API_KEY|_KEY|WEBHOOK|DISCORD|_URL|DB_USER)' "$f" \
        | grep -vE '^[0-9]+:[[:space:]]*#' \
        | sed -E -e 's/^([0-9]+):[[:space:]]*-?[[:space:]]*"?([A-Za-z0-9_.-]+)[:=].*\$\{.*/\1 \2 reference/' -e 't' \
                 -e 's/^([0-9]+):[[:space:]]*-?[[:space:]]*"?([A-Za-z0-9_.-]+)[:=].*/\1 \2 LITERAL/'
      echo "--- contents (masked)"
      mask_secrets < "$f"
    done
    echo
    echo "--- end"
    ```

### scan_repo_secrets.py

Searches every tracked file and every commit of the repository for the real secret values, and prints the file and key name of each hit, never a value.

- When: before you push for the first time, after the move of each server, and whenever you are unsure.
- Example: `python3 -I tools/scan_repo_secrets.py --repo /root/<your-repo> /root/secrets-server-a.env --env-dir /home/.env_files`
- A hit in a commit means the secret is in the history of every clone: change the secret itself.
- Exit codes: 0 no hits, 1 hits, 2 wrong arguments.

??? example "tools/scan_repo_secrets.py"

    ```python
    #!/usr/bin/env python3
    """Look for secret values in a Git repository: in every tracked file and in
    every commit of every branch.

    Why
    ---
    A GitOps repository holds the compose files, and the secrets must stay out
    of it. A value that was committed once stays in the history, even after a
    later commit removes it, and anyone with a clone can read it. This tool
    takes the real secret values from the files that hold them on the server
    and searches the repository for each one. It prints names only, never a
    value, so its output is safe to share.

    It only reads. It runs `git ls-files`, `git rev-list --all` and `git show`.

    Usage
    -----
    Run it on the server that holds the secrets, in or against its clone:

        python3 -I tools/scan_repo_secrets.py --repo /root/<your-repo> /root/secrets-server-a.env
        python3 -I tools/scan_repo_secrets.py --repo /root/<your-repo> --env-dir /home/.env_files

    Arguments:

        SECRETS_FILE ...   Files of NAME='value' lines, such as the secrets file
                           that split_stacks.py writes. Every value counts as a
                           secret, except usernames (see below).
        --env-dir DIR      A folder of env files (*.env and .*.env). Only keys
                           whose names look sensitive count: pass, secret, token,
                           key, webhook, discord, _url, auth, credential, private,
                           bearer, cookie, salt or dsn, in any case.
        --repo PATH        The repository to scan. The default is the current
                           folder.
        --min-length N     Skip values shorter than N characters (default 8),
                           because short values such as "1000" match by chance.

    Give at least one SECRETS_FILE or --env-dir.

    Keys that look like usernames (user, login, email) are skipped. A username
    such as "forgejo" is often also a service name and a folder name, so it
    would match everywhere and hide the real hits.

    Values in the files may be bare, 'single-quoted' or "double-quoted", and a
    line may start with "export ". Blank lines and # comments are skipped.

    Output
    ------
        12 values checked, from 1 secrets files and 9 env files; 4 username keys skipped
        34 tracked files and 57 commits scanned
        HIT: secrets-server-a.env DB_PASSWORD in file server-a/app/docker-compose.yml
        HIT: .app.env API_TOKEN in commit 1a2b3c4
        2 hits

    A hit "in file" means that the value is in the current files: replace it
    with a variable and commit. A hit "in commit" means that the value is in the
    history (in the change or in the message of that commit). Removing it from
    the files is not enough: change the secret itself, because the old value
    stays readable in every clone.

    Exit codes: 0 no hits, 1 at least one hit, 2 wrong arguments, a file that
    cannot be read, or a folder that is not a Git repository.
    """
    import argparse
    import glob
    import os
    import re
    import subprocess
    import sys

    SENSITIVE = re.compile(
        r"pass|secret|token|key|webhook|discord|_url|auth|credential|private|bearer|cookie|salt|dsn",
        re.I,
    )
    USERNAME = re.compile(r"user|login|email", re.I)


    class ScanError(Exception):
        pass


    def parse(path):
        """Return [(name, value)] from a file of NAME=value lines."""
        pairs = []
        try:
            with open(path, encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
        except OSError as error:
            raise ScanError(f"cannot read {path}: {error.strerror}") from None
        for line in lines:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            name, _, value = line.partition("=")
            name = name.strip()
            if name.startswith("export "):
                name = name[len("export "):].strip()
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
                value = value[1:-1].replace("\\'", "'")
            pairs.append((name, value))
        return pairs


    def wanted(secrets_files, env_dir, min_length):
        """Return ({value: {"<file> <KEY>", ...}}, usernames skipped, env files read)."""
        values = {}
        skipped = 0
        sources = [(path, False) for path in secrets_files]
        env_files = []
        if env_dir:
            if not os.path.isdir(env_dir):
                raise ScanError(f"cannot read {env_dir}: not a folder")
            env_files = sorted(set(glob.glob(os.path.join(env_dir, ".*.env")) + glob.glob(os.path.join(env_dir, "*.env"))))
            sources += [(path, True) for path in env_files]
        for path, only_sensitive in sources:
            for name, value in parse(path):
                if USERNAME.search(name):
                    skipped += 1
                elif (not only_sensitive or SENSITIVE.search(name)) and len(value) >= min_length:
                    values.setdefault(value, set()).add(f"{os.path.basename(path)} {name}")
        return values, skipped, len(env_files)


    def git(repo, *args):
        result = subprocess.run(
            ["git", "-C", repo, *args], capture_output=True, text=True, encoding="utf-8", errors="ignore"
        )
        if result.returncode != 0:
            last = (result.stderr.strip().splitlines() or ["no message"])[-1]
            raise ScanError(f"git {args[0]} failed in {repo}: {last}")
        return result.stdout


    def report(where, text, values, hits):
        for value, names in values.items():
            if value in text:
                for name in names:
                    hits.add(f"{name} in {where}")


    def scan(repo, values):
        """Return (hits, files scanned, commits scanned)."""
        hits = set()
        files = git(repo, "ls-files").splitlines()
        for path in files:
            try:
                with open(os.path.join(repo, path), encoding="utf-8", errors="ignore") as f:
                    report(f"file {path}", f.read(), values, hits)
            except OSError:
                continue  # listed in the index but deleted in the work tree
        commits = git(repo, "rev-list", "--all").split()
        for commit in commits:
            # %B is the full message. -m shows the changes of a merge against
            # each parent, so a value added in a merge is found too.
            report(f"commit {commit[:7]}", git(repo, "show", "-m", "--format=%B", commit), values, hits)
        return sorted(hits), len(files), len(commits)


    def main(argv=None):
        parser = argparse.ArgumentParser(
            description="Look for secret values in every tracked file and every commit of a Git repository. "
            "Prints names, never values. Read the top of this file for details."
        )
        parser.add_argument("secrets_files", nargs="*", metavar="SECRETS_FILE", help="files of NAME='value' lines")
        parser.add_argument("--env-dir", help="folder of env files; only sensitive-looking keys count")
        parser.add_argument("--repo", default=".", help="the repository to scan (default: the current folder)")
        parser.add_argument("--min-length", type=int, default=8, help="skip shorter values (default: 8)")
        try:
            args = parser.parse_args(argv)
        except SystemExit as error:
            return error.code
        if not args.secrets_files and not args.env_dir:
            parser.print_usage(sys.stderr)
            print("error: give at least one SECRETS_FILE or --env-dir", file=sys.stderr)
            return 2
        try:
            values, skipped, env_count = wanted(args.secrets_files, args.env_dir, args.min_length)
            print(
                f"{len(values)} values checked, from {len(args.secrets_files)} secrets files and "
                f"{env_count} env files; {skipped} username keys skipped"
            )
            hits, files, commits = scan(args.repo, values)
        except ScanError as error:
            parser.print_usage(sys.stderr)
            print(f"error: {error}", file=sys.stderr)
            return 2
        print(f"{files} tracked files and {commits} commits scanned")
        for hit in hits:
            print(f"HIT: {hit}")
        print("no hits" if not hits else f"{len(hits)} hits")
        return 1 if hits else 0


    if __name__ == "__main__":
        sys.exit(main())
    ```

### backup_stacks.py

Backs up every Compose stack of a server with restic, one stopped stack at a time, and starts each stack again. It reports to Discord, Healthchecks.io or ntfy, and can pause Healthchecks tests with Tronitor and run hooks.

- When: once a week from a systemd timer, and by hand for a dry run, a seed or a restore. See [Weekly backups](backups.md).
- Reads: `/etc/backup-stacks/<name>.json` (example below) and `/etc/backup-stacks/<name>.env`. It does not use the stack map.
- Example: `python3 -I /usr/local/sbin/backup_stacks.py server-a --all --dry-run`
- Needs: restic, and Docker with the Compose plugin.
- Exit codes: 0 every stack backed up, 1 something failed, 2 wrong arguments, config or secrets (no stack was stopped).

??? example "tools/backup_stacks.py"

    ```python
    #!/usr/bin/env python3
    """Back up every Docker Compose stack on a server with restic, one stopped
    stack at a time.

    Why
    ---
    A copy of a database folder is only consistent while the database is
    stopped. This tool stops one stack, backs up the folders it mounts, and
    starts it again, so each stack is down for only its own backup. restic
    stores each chunk of data once, so after the first run a backup writes
    only what changed. Each snapshot also holds a manifest of the stack's
    containers, images and digests, so a restore knows which image can read
    the files.

    It finds stacks by the Compose project label, so it works with Komodo,
    Portainer, Dockge or plain `docker compose`. It never pulls an image, never
    runs `docker compose down`, never deletes a container or volume, and starts
    every stack that was running, also when the backup of that stack fails.

    It needs Python 3.9 or later (standard library only), Docker with the
    Compose plugin, and restic. Run it as root.

    Usage
    -----
        backup_stacks.py NAME --all
        backup_stacks.py NAME STACK [STACK ...]
        backup_stacks.py NAME --all --dry-run
        backup_stacks.py NAME --all --seed
        backup_stacks.py NAME --restic ARGS...
        backup_stacks.py --config PATH --all

    NAME reads the config /etc/backup-stacks/NAME.json. --config PATH reads a
    config elsewhere; the first word after it is then a stack name. STACK is a
    Compose project name, as `docker compose ls` shows it. --all takes every
    project on the server except those in "exclude".

    --dry-run prints the order, and for each stack the running services, the
    paths to back up, the missing and skipped paths, and the tests to pause.
    It reads no secrets, stops nothing and runs no restic.

    --seed makes the first snapshot of each stack without stopping it and
    without a time limit. Snapshots of running databases can be torn, so seed
    snapshots get the tag `seed` and are never meant for a restore. After the
    first stopped run of a stack succeeds, its seed snapshots are deleted.

    --restic runs restic with the rest of the command line and the secrets
    file, for example `--restic init`, `--restic snapshots` or `--restic
    restore latest --tag stack:STACK --target /root/restore`. Use it instead of
    sourcing the secrets file in a shell: the shell expands $, backticks and
    backslashes in values, and this tool reads them literally.

    The config file
    ---------------
    /etc/backup-stacks/NAME.json. Only data_roots is required. An unknown key
    is an error, so a typing mistake cannot silently turn off a setting.

        {
          "data_roots": ["/srv/appdata"],
          "host": "server-a",
          "require_mount": "/mnt/backup",
          "last": ["monitoring", "proxy"],
          "exclude": ["scratch"],
          "timeout_minutes": 60,
          "retention": {"keep_daily": 7, "keep_weekly": 4},
          "tronitor": {
            "path": "tronitor",
            "lock_dir": "/tmp",
            "monitors": {"media": ["Sonarr", "Radarr"], "proxy": ["*"]}
          },
          "hooks": {
            "before_run": ["touch", "/run/backup-running"],
            "after_run": ["rm", "-f", "/run/backup-running"]
          }
        }

    data_roots: bind mounts inside these folders are backed up. Named volumes
    are always backed up; anonymous volumes and everything else are skipped
    and listed in the report. Absolute folders, not / itself.
    host: restic's --host. Default: the machine's host name.
    secrets_file: default NAME.env next to the config.
    require_mount: checked before the run and before each stack. If it does not
    answer, no further stack is stopped.
    last: stacks that go at the end, in this order. The rest go first, in
    alphabetical order.
    exclude: stacks that --all leaves out. A stack named on the command line
    still runs.
    A name in last, exclude or tronitor.monitors that matches no stack on the
    server is a note in the report and in the dry run, so a typing mistake
    shows up.
    timeout_minutes: per stack. restic is killed at the limit and the stack
    starts again. Default 60.
    retention: at least one of keep_last, keep_hourly, keep_daily, keep_weekly,
    keep_monthly, keep_yearly, passed to `restic forget --prune`, grouped by
    host and tags. Default {"keep_weekly": 4}.
    tronitor: optional. While a stack is stopped, its Healthchecks tests are
    paused with the Python Tronitor (-m hc), by the names that `-l` shows. The
    tool reads the list with --json, which the old Bash Tronitor does not have.
    path is the command, found on the PATH when it has no folder. ["*"] means
    every test that is neither paused nor down. Tests that are already paused
    or down are left alone. A test counts as unpaused only when Tronitor's list
    shows it. With lock_dir, the tool also creates <test ID>.lock for each test
    (healthchecks.lock for "*") in Tronitor's lock folder (/tmp by default),
    and removes the lock files that Tronitor writes, so that local check
    scripts skip the stack.
    hooks: optional commands, as lists of words, run without a shell, with a
    5-minute limit and no secrets:
        before_run    after the run lock and the mount check
        before_stop   before a stack is stopped (BACKUP_STACK)
        after_start   after it started again, also after a failure
                      (BACKUP_STACK, BACKUP_STACK_OK=1 or 0)
        after_run     after the last stack, also on SIGTERM (BACKUP_RUN_OK=1
                      only when the whole run finished without a failure)
    A --seed run only runs before_run and after_run. A hook's output goes to
    the run's output (the journal under systemd). A hook that fails, hangs or
    cannot start is a note in the report, never a failure of the backup. On a
    SIGTERM, hooks share the time systemd allows for the stop (TimeoutStopSec).
    manifest_dir, lock_path: default /var/lib/backup-stacks/manifests and
    /run/backup-stacks.lock. Give manifest_dir a folder of its own: a folder
    the tool creates is limited to root. secrets_file, require_mount,
    manifest_dir, lock_path and tronitor.lock_dir must be absolute paths.

    The secrets file
    ----------------
    /etc/backup-stacks/NAME.env, owned by root, mode 600, with KEY=value lines.
    Put each value in single quotes.

        RESTIC_REPOSITORY=...      or RESTIC_REPOSITORY_FILE
        RESTIC_PASSWORD=...        or RESTIC_PASSWORD_FILE, RESTIC_PASSWORD_COMMAND
        AWS_ACCESS_KEY_ID=...      storage keys: any key that starts with AWS_,
                                   B2_, AZURE_, GOOGLE_, OS_, ST_ or RCLONE_
                                   goes to restic
        DISCORD_WEBHOOK_URL=...    optional: a Discord embed
        HC_PING_URL=...            optional: Healthchecks.io /start, success, /fail
        NTFY_URL=...               optional: the ntfy topic URL
        NTFY_TOKEN=...             optional: an ntfy access token

    Only restic gets the restic and storage keys. The tool refuses a file that
    others can read, and its messages name keys, never values.

    What a run does
    ---------------
    1. Takes the run lock. If another run holds it, it stops with exit code 2.
    2. If require_mount does not answer, it reports and stops with exit code 2.
    3. Runs before_run and `restic unlock`.
    4. For each stack: runs before_stop, quiets its tests, stops its running
       services (120 s grace for databases), runs `restic backup` with the tag
       stack:STACK and the host, starts the services again (3 tries, then
       `docker start`), restores the tests and runs after_start. If the target
       stops answering or a backup times out, no further stack is stopped.
    5. Unless --seed: deletes the seed snapshots of the stacks that succeeded,
       runs `restic forget --prune` with the retention, and `restic check`.
    6. Runs after_run, sends the report to each notification channel.

    On SIGTERM (systemctl stop, the unit's time limit, a shutdown), the stack
    that is down is started again, its tests are restored, after_run runs and
    the report is sent before the tool exits.

    Exit codes: 0 every stack backed up, 1 something failed (the report says
    what), 2 wrong arguments, config or secrets, another run active, or the
    backup share missing. With exit code 2, no stack was stopped.
    """
    import argparse
    import json
    import os
    import posixpath
    import re
    import signal
    import socket
    import subprocess
    import sys
    import time
    from dataclasses import dataclass, field
    from typing import Dict, List, Optional

    NAME = re.compile(r"[A-Za-z0-9][A-Za-z0-9_-]*")
    ANONYMOUS_VOLUME = re.compile(r"[0-9a-f]{64}")
    PROJECT_LABEL = "com.docker.compose.project"
    SERVICE_LABEL = "com.docker.compose.service"
    DOCKER_TIMEOUT_S = 300
    STOP_GRACE_S = 120
    STOP_TIMEOUT_S = 900
    START_TRIES = 3
    START_WAIT_S = 60
    KILL_WAIT_S = 60
    DEAD_TARGET = "not backed up: backup target not answering"
    PROGRESS_FPS = "0.016666"


    # Each entry: the keys of which one must be set. restic reads all of them.
    REQUIRED_SECRETS = (
        ("RESTIC_REPOSITORY", "RESTIC_REPOSITORY_FILE"),
        ("RESTIC_PASSWORD", "RESTIC_PASSWORD_FILE", "RESTIC_PASSWORD_COMMAND"),
    )
    # restic and the storage keys of its backends: S3, B2, Azure, Google Cloud
    # Storage, OpenStack Swift, rclone.
    RESTIC_KEY_PREFIXES = ("RESTIC_", "AWS_", "B2_", "AZURE_", "GOOGLE_", "OS_", "ST_", "RCLONE_")
    TRONITOR = "tronitor"
    GLOBAL_LOCK = "healthchecks.lock"
    # Tests in these states are not paused: a paused one may be paused by hand,
    # and a down one already alerts, so a pause would only hide the outage.
    LEAVE_ALONE = ("paused", "down")
    UNPAUSE_TRIES = 10
    UNPAUSE_WAIT_S = 30
    CONFIG_DIR = "/etc/backup-stacks"
    MANIFEST_DIR = "/var/lib/backup-stacks/manifests"
    LOCK_PATH = "/run/backup-stacks.lock"
    CONFIG_KEYS = (
        "host", "data_roots", "secrets_file", "require_mount", "last", "exclude",
        "timeout_minutes", "retention", "tronitor", "hooks", "manifest_dir", "lock_path",
    )
    RETENTION_KEYS = ("keep_last", "keep_hourly", "keep_daily", "keep_weekly", "keep_monthly", "keep_yearly")
    TRONITOR_KEYS = ("path", "lock_dir", "monitors")
    HOOK_NAMES = ("before_run", "before_stop", "after_start", "after_run")


    class StepError(Exception):
        """A Docker or restic step failed. The message is safe to report."""


    class UsageError(Exception):
        """Wrong arguments, settings or secrets file. Nothing was touched."""


    def _check_keys(where, data, allowed):
        if not isinstance(data, dict):
            raise UsageError(f"{where} must be an object")
        unknown = sorted(set(data) - set(allowed))
        if unknown:
            raise UsageError(f"{where}: unknown key {unknown[0]}")


    def _words(value):
        return isinstance(value, list) and all(isinstance(word, str) and word for word in value)


    def _absolute(value):
        """A non-empty absolute path (also on Windows, where the tests run)."""
        return isinstance(value, str) and bool(value) and (value.startswith("/") or os.path.isabs(value))


    def _positive(value):
        return isinstance(value, int) and not isinstance(value, bool) and value > 0


    def load_config(path, name, hostname=socket.gethostname):
        """Read the config file, check every key, and fill in the defaults.

        An unknown key is an error, so a typing mistake cannot silently turn off
        a setting. The secrets file defaults to NAME.env next to the config.
        """
        if not os.path.isfile(path):
            raise UsageError(f"no config {path}")
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        except ValueError as error:
            raise UsageError(f"{path} is not valid JSON: {getattr(error, 'msg', error)}")
        _check_keys(path, data, CONFIG_KEYS)
        roots = data.get("data_roots")
        if not (_words(roots) and roots and all(root.startswith("/") for root in roots)):
            raise UsageError(f"{path}: data_roots must be a list of absolute folders, for example [\"/home\"]")
        roots = [posixpath.normpath(root) for root in roots]
        if "/" in roots:
            raise UsageError(f"{path}: data_roots must not be / (that would back up the whole system)")
        config = {
            "host": hostname(),
            "data_roots": roots,
            "secrets_file": os.path.join(os.path.dirname(os.path.abspath(path)), f"{name}.env"),
            "require_mount": None,
            "last": [],
            "exclude": [],
            "timeout_minutes": 60,
            "retention": {"keep_weekly": 4},
            "tronitor": None,
            "hooks": {},
            "manifest_dir": MANIFEST_DIR,
            "lock_path": LOCK_PATH,
        }
        config.update(data)
        config["data_roots"] = roots
        if not (isinstance(config["host"], str) and config["host"]):
            raise UsageError(f"{path}: host must be a text value")
        for key in ("secrets_file", "manifest_dir", "lock_path"):
            if not _absolute(config[key]):
                raise UsageError(f"{path}: {key} must be an absolute path")
        if config["require_mount"] is not None and not _absolute(config["require_mount"]):
            raise UsageError(f"{path}: require_mount must be an absolute folder")
        for key in ("last", "exclude"):
            if not isinstance(config[key], list) or not all(isinstance(n, str) for n in config[key]):
                raise UsageError(f"{path}: {key} must be a list of stack names")
        if not _positive(config["timeout_minutes"]):
            raise UsageError(f"{path}: timeout_minutes must be a whole number above 0")
        _check_keys(f"{path}: retention", config["retention"], RETENTION_KEYS)
        if not config["retention"]:
            raise UsageError(f"{path}: retention needs at least one rule, for example {{\"keep_weekly\": 4}}")
        for key, value in config["retention"].items():
            if not _positive(value):
                raise UsageError(f"{path}: retention.{key} must be a whole number above 0")
        if config["tronitor"] is not None:
            _check_keys(f"{path}: tronitor", config["tronitor"], TRONITOR_KEYS)
            tronitor = dict({"lock_dir": None, "monitors": {}}, **config["tronitor"])
            if not (isinstance(tronitor.get("path"), str) and tronitor["path"]):
                raise UsageError(f"{path}: tronitor.path must name the Tronitor script")
            if tronitor["lock_dir"] is not None and not _absolute(tronitor["lock_dir"]):
                raise UsageError(f"{path}: tronitor.lock_dir must be null or an absolute folder")
            monitors = tronitor["monitors"]
            if not isinstance(monitors, dict) or not all(_words(names) for names in monitors.values()):
                raise UsageError(f"{path}: tronitor.monitors must map each stack to a list of test names")
            config["tronitor"] = tronitor
        _check_keys(f"{path}: hooks", config["hooks"], HOOK_NAMES)
        for hook, argv in config["hooks"].items():
            if not (_words(argv) and argv):
                raise UsageError(f"{path}: hooks.{hook} must be a list of words, for example [\"touch\", \"/run/x\"]")
        return config


    def load_secrets(path, stat=os.stat):
        """Read KEY=value lines from a file that only root can read.

        Error messages name the file, a key or a line number, never a value.
        """
        if not os.path.isfile(path):
            raise UsageError(f"no secrets file {path}")
        info = stat(path)
        if info.st_uid != 0 or info.st_mode & 0o077:
            raise UsageError(f"{path} must belong to root and be readable only by root (chmod 600)")
        secrets = {}
        with open(path, encoding="utf-8") as f:
            for number, line in enumerate(f, start=1):
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                key, sep, value = line.partition("=")
                key = key.strip()
                if not sep or not key:
                    raise UsageError(f"{path} line {number} is not KEY=value")
                value = value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
                    value = value[1:-1]
                secrets[key] = value
        for keys in REQUIRED_SECRETS:
            if not any(secrets.get(key) for key in keys):
                raise UsageError(f"{path} has no {keys[0]} (or {', '.join(keys[1:])})")
        return secrets


    def restic_env(secrets, base=None):
        """The environment for restic: base plus the restic and storage keys only."""
        env = dict(os.environ if base is None else base)
        env.update({k: v for k, v in secrets.items() if k.startswith(RESTIC_KEY_PREFIXES)})
        # restic --json prints progress about 60 times a second; once a minute is plenty.
        env.setdefault("RESTIC_PROGRESS_FPS", PROGRESS_FPS)
        return env


    def _container_name(container):
        return container.get("Name", "").lstrip("/")


    def _inside(path, folder):
        """True if path is folder or lies below it."""
        return path == folder or path.startswith(folder.rstrip("/") + "/")


    def select_paths(containers, roots=("/home",)):
        """Return (paths, skipped) for the mounts of a stack's containers.

        A bind mount is kept if it lies inside one of the data roots.

        paths: the folders and files to back up, sorted, without duplicates and
        without paths that lie inside another selected path.
        skipped: one readable line per mount that is not backed up, sorted.
        """
        chosen = set()
        skipped = set()
        for container in containers:
            name = _container_name(container)
            for mount in container.get("Mounts") or []:
                kind = mount.get("Type")
                source = posixpath.normpath(mount.get("Source") or "") if mount.get("Source") else ""
                destination = mount.get("Destination", "")
                if kind == "bind" and source and any(_inside(source, root) for root in roots):
                    chosen.add(source)
                elif kind == "volume" and ANONYMOUS_VOLUME.fullmatch(mount.get("Name") or ""):
                    skipped.add(f"anonymous volume {destination} of {name}")
                elif kind == "volume" and source:
                    chosen.add(source)
                elif kind == "bind" and source:
                    skipped.add(f"{source} ({name})")
                else:
                    skipped.add(f"{kind} {destination} ({name})")
        outer = [p for p in sorted(chosen) if not any(p != q and _inside(p, q) for q in chosen)]
        return outer, sorted(skipped)


    def manifest(project, containers):
        """Describe a stack's containers, so a restore knows which image wrote the files."""
        rows = []
        for container in containers:
            config = container.get("Config") or {}
            labels = config.get("Labels") or {}
            rows.append(
                {
                    "name": _container_name(container),
                    "service": labels.get("com.docker.compose.service", ""),
                    "image": config.get("Image", ""),
                    "image_id": container.get("Image", ""),
                    "state": (container.get("State") or {}).get("Status", ""),
                    "mounts": [
                        {
                            "type": m.get("Type", ""),
                            "source": m.get("Source", ""),
                            "destination": m.get("Destination", ""),
                        }
                        for m in container.get("Mounts") or []
                    ],
                }
            )
        rows.sort(key=lambda row: row["name"])
        return {"stack": project, "containers": rows}


    def forget_args(host, retention):
        """The restic forget command for the retention rule, flags in a fixed order."""
        flags = []
        for key in RETENTION_KEYS:
            if key in retention:
                flags += ["--" + key.replace("_", "-"), str(retention[key])]
        return ["forget", "--host", host, "--group-by", "host,tags"] + flags + ["--prune"]


    def order_stacks(names, last):
        """Sort the stacks, with the names in last at the end, in last's order."""
        unique = set(names)
        first = sorted(name for name in unique if name not in last)
        return first + [name for name in last if name in unique]


    def existing_paths(paths, exists=os.path.exists):
        """Split paths into (present, missing)."""
        present = [p for p in paths if exists(p)]
        missing = [p for p in paths if not exists(p)]
        return present, missing


    def running_services(containers):
        """The Compose services that have a running container, sorted."""
        return sorted(
            {
                ((c.get("Config") or {}).get("Labels") or {}).get(SERVICE_LABEL, "")
                for c in containers
                if (c.get("State") or {}).get("Status") == "running"
            }
            - {""}
        )


    class Docker:
        """The only Docker commands the backup uses: list, inspect, stop, start.

        runner stands in for subprocess.run, so tests can pass a fake.
        """

        def __init__(self, runner=subprocess.run):
            self.runner = runner

        def _run(self, args, timeout=DOCKER_TIMEOUT_S):
            try:
                result = self.runner(args, capture_output=True, text=True, cwd="/", timeout=timeout)
            except subprocess.TimeoutExpired:
                raise StepError(f"{' '.join(args[:5])} timed out after {timeout} seconds")
            if result.returncode != 0:
                lines = (result.stderr or result.stdout or "").strip().splitlines()
                raise StepError(lines[-1] if lines else f"{' '.join(args[:5])} failed")
            return result.stdout

        def projects(self):
            out = self._run(["docker", "ps", "-a", "--format", '{{.Label "' + PROJECT_LABEL + '"}}'])
            return sorted({line.strip() for line in out.splitlines() if line.strip()})

        def containers(self, project):
            ids = self._run(["docker", "ps", "-a", "-q", "--filter", f"label={PROJECT_LABEL}={project}"]).split()
            if not ids:
                return []
            return json.loads(self._run(["docker", "inspect"] + ids))

        def stop(self, project, services):
            # Databases get 120 s to shut down cleanly before Docker kills them.
            # Compose stops one dependency level at a time, so the command
            # itself gets a longer limit.
            self._run(
                ["docker", "compose", "-p", project, "stop", "-t", str(STOP_GRACE_S)] + list(services),
                timeout=STOP_TIMEOUT_S,
            )

        def start(self, project, services):
            self._run(["docker", "compose", "-p", project, "start"] + list(services))

        def start_ids(self, ids):
            """Last resort when compose start keeps failing: start containers by ID."""
            self._run(["docker", "start"] + list(ids))


    class Restic:
        """Runs restic with the repository and password in its environment only."""

        def __init__(self, env, popen=subprocess.Popen):
            self.env = env
            self.popen = popen

        def run(self, args, timeout):
            """Return (returncode, stdout, stderr). returncode is None after a timeout.

            At the time limit restic is killed. If it does not exit within
            KILL_WAIT_S, for example while it flushes to a dead NFS mount, it is
            left behind, so the caller can still start the stack again.
            """
            process = self.popen(
                ["restic"] + list(args), stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=self.env
            )
            try:
                out, err = process.communicate(timeout=timeout)
            except subprocess.TimeoutExpired:
                process.kill()
                try:
                    process.communicate(timeout=KILL_WAIT_S)
                except subprocess.TimeoutExpired:
                    pass
                return None, "", f"timed out after {round(timeout / 60)} minutes"
            except BaseException:
                # SIGTERM (SystemExit) or Ctrl-C: do not leave restic running.
                process.kill()
                raise
            return process.returncode, out, err


    class Tronitor:
        """Pauses and unpauses Healthchecks tests by name with Tronitor."""

        def __init__(self, path=TRONITOR, runner=subprocess.run):
            self.path = path
            self.runner = runner

        def _run(self, *args):
            try:
                return self.runner([self.path, "-m", "hc"] + list(args), capture_output=True, text=True, timeout=120)
            except (OSError, subprocess.TimeoutExpired):
                return None

        def tests(self):
            """Return {name: (test_id, status)} as Tronitor lists them, or None.

            --json prints the Healthchecks API records. Output that is not a
            JSON list, such as the table of the old Bash Tronitor, gives None.
            """
            result = self._run("-l", "--json")
            if result is None or result.returncode != 0:
                return None
            try:
                records = json.loads(result.stdout)
            except ValueError:
                return None
            if not isinstance(records, list):
                return None
            found = {}
            for record in records:
                if not isinstance(record, dict):
                    continue
                name, test_id, status = record.get("name"), record.get("uuid"), record.get("status")
                if all(isinstance(value, str) for value in (name, test_id, status)):
                    found[name] = (test_id, status)
            return found

        def pause(self, names):
            if not names:
                return True
            result = self._run("-p", ",".join(names))
            return result is not None and result.returncode == 0

        def unpause(self, names):
            """One unpause call. Its exit code is not enough: right after
            Healthchecks starts, the call can fail, so restore_monitors reads
            the test list afterwards."""
            if not names:
                return True
            result = self._run("-u", ",".join(names))
            return result is not None and result.returncode == 0


    @dataclass
    class Quiet:
        locks: List[str] = field(default_factory=list)
        paused: List[str] = field(default_factory=list)
        notes: List[str] = field(default_factory=list)
        ids: Dict[str, str] = field(default_factory=dict)
        lock_dir: str = ""


    def _lock(quiet, lock_dir, name):
        if not lock_dir:
            return  # no lock folder in the config: Tronitor only pauses
        path = os.path.join(lock_dir, name)
        with open(path, "w", encoding="utf-8"):
            pass
        os.chmod(path, 0o644)
        quiet.locks.append(path)


    def quiet_monitors(entry, tronitor, lock_dir, quiet=None):
        """Silence a stack's tests: lock files for the local checks, and pauses.

        entry is the stack's list from the monitor map. ["*"] means the global
        lock and every test that is not already paused. A test that is already
        paused, for example by hand, is not paused, so it is not unpaused later.
        Notes name tests, never their IDs.

        The caller may pass its own Quiet: it is filled as each lock is made, so
        restore_monitors can remove them even if this function fails halfway.
        """
        quiet = Quiet() if quiet is None else quiet
        quiet.lock_dir = lock_dir
        if not entry:
            return quiet
        tests = tronitor.tests()
        if tests is None:
            quiet.notes.append("could not list tests")
        if entry == ["*"]:
            _lock(quiet, lock_dir, GLOBAL_LOCK)
            to_pause = sorted(n for n, (_i, status) in (tests or {}).items() if status.lower() not in LEAVE_ALONE)
            quiet.ids.update({name: tests[name][0] for name in to_pause})
        elif tests is None:
            to_pause = list(entry)
        else:
            by_lower = {name.lower(): name for name in tests}
            to_pause = []
            for wanted in entry:
                name = by_lower.get(wanted.lower())
                if name is None:
                    quiet.notes.append(f"unknown test {wanted}")
                    continue
                test_id, status = tests[name]
                _lock(quiet, lock_dir, f"{test_id}.lock")
                if status.lower() not in LEAVE_ALONE:
                    to_pause.append(name)
                    quiet.ids[name] = test_id
        if to_pause:
            if not tronitor.pause(to_pause):
                quiet.notes.append("monitor pause failed")
            # Unpause later even after a failed pause: some tests may be paused.
            quiet.paused = to_pause
        return quiet


    def _remove(path):
        try:
            os.remove(path)
        except FileNotFoundError:
            pass


    def restore_monitors(quiet, tronitor, sleep=time.sleep):
        """Remove the lock files, then unpause what quiet_monitors paused.

        A test counts as unpaused only when Tronitor's list says so: right after
        the monitoring stack starts, Healthchecks may not answer yet, or may list
        no tests yet. Up to UNPAUSE_TRIES rounds,
        UNPAUSE_WAIT_S apart, each for the tests that are still paused.

        Tronitor also writes <test ID>.lock when it pauses a test, and removes it
        only for the tests its unpause reaches. Those locks are removed here in
        every case, so the local checks ping again; a ping resumes a paused test.
        """
        for path in quiet.locks:
            _remove(path)
        remaining = list(quiet.paused)
        for attempt in range(UNPAUSE_TRIES if remaining else 0):
            if attempt:
                sleep(UNPAUSE_WAIT_S)
            tronitor.unpause(remaining)
            listing = tronitor.tests()
            if listing is None:
                continue
            # A test missing from the list is not confirmed: right after
            # Healthchecks starts, Tronitor can print an empty list and exit 0.
            remaining = [name for name in remaining if name not in listing or listing[name][1].lower() == "paused"]
            if not remaining:
                break
        for test_id in quiet.ids.values() if quiet.lock_dir else ():
            _remove(os.path.join(quiet.lock_dir, f"{test_id}.lock"))
        if remaining:
            return [f"monitor unpause failed: {', '.join(remaining)}"]
        return []


    HOOK_TIMEOUT_S = 300


    def run_hook(name, argv, extra, runner=subprocess.run):
        """Run one hook without a shell. Return None, or a note if it failed.

        The hook gets this process's environment, which holds no secrets (they
        go only to restic), plus BACKUP_HOOK and the given extra values. Its
        output is not captured: it goes to this run's output, the journal under
        systemd. Nothing a hook does can raise out of here.
        """
        env = dict(os.environ, BACKUP_HOOK=name, **extra)
        try:
            result = runner(list(argv), env=env, timeout=HOOK_TIMEOUT_S, cwd="/")
        except subprocess.TimeoutExpired:
            return f"hook {name} failed: timed out"
        except FileNotFoundError:
            return f"hook {name} failed: not found"
        except OSError as error:
            return f"hook {name} failed: could not run ({type(error).__name__})"
        except Exception as error:  # a hook must never break the backup
            return f"hook {name} failed: {type(error).__name__}"
        if result.returncode != 0:
            return f"hook {name} failed: exit {result.returncode}"
        return None


    def _call_hook(hooks, hook, name, extra, notes):
        argv = (hooks or {}).get(name)
        if argv:
            try:
                note = hook(name, argv, extra)
            except Exception as error:  # a hook must never break the backup
                note = f"hook {name} failed: {type(error).__name__}"
            if note:
                notes.append(note)


    @dataclass
    class StackResult:
        name: str
        ok: bool = True
        was_running: bool = False
        downtime_s: float = 0.0
        added_bytes: int = 0
        paths: List[str] = field(default_factory=list)
        skipped: List[str] = field(default_factory=list)
        missing: List[str] = field(default_factory=list)
        notes: List[str] = field(default_factory=list)
        error: Optional[str] = None
        still_stopped: bool = False


    def _write_manifest(manifest_dir, project, containers):
        if not os.path.isdir(manifest_dir):
            # Only a folder the tool creates is limited to root; an existing
            # folder keeps its mode (it might be shared, for example /tmp).
            os.makedirs(manifest_dir, mode=0o700)
            os.chmod(manifest_dir, 0o700)
        path = os.path.join(manifest_dir, f"{project}.json")
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(manifest(project, containers), f, indent=2)
        os.chmod(path, 0o600)
        return path


    def _data_added(stdout):
        for line in reversed((stdout or "").splitlines()):
            try:
                message = json.loads(line)
            except ValueError:
                continue
            if isinstance(message, dict) and message.get("message_type") == "summary":
                return int(message.get("data_added") or 0)
        return 0


    def _last_line(text, fallback):
        lines = (text or "").strip().splitlines()
        return lines[-1] if lines else fallback


    def back_up_stack(
        project,
        *,
        server,
        docker,
        restic,
        tronitor,
        monitors,
        seed,
        timeout_s,
        manifest_dir,
        lock_dir,
        clock=time.monotonic,
        exists=os.path.exists,
        sleep=time.sleep,
        data_roots=("/home",),
        hooks=None,
        hook=run_hook,
    ):
        """Back up one stack: quiet its tests, stop it, run restic, start it again.

        The start and the restore of the tests run even when restic fails or
        times out, and on SIGTERM. A seed run neither stops the stack nor
        touches its tests.
        """
        result = StackResult(project)
        containers = docker.containers(project)
        paths, result.skipped = select_paths(containers, data_roots)
        result.paths, result.missing = existing_paths(paths, exists=exists)
        manifest_path = _write_manifest(manifest_dir, project, containers)
        services = running_services(containers)
        result.was_running = bool(services)

        quiet = Quiet()
        quieted = False
        stopped_at = None
        try:
            try:
                if not seed:
                    _call_hook(hooks, hook, "before_stop", {"BACKUP_STACK": project}, result.notes)
                    if tronitor is not None and monitors:
                        quieted = True
                        quiet_monitors(monitors, tronitor, lock_dir, quiet)
                        result.notes.extend(quiet.notes)
                    if services:
                        # Set before the stop: a stop that fails partway has
                        # already stopped some containers, so start them again.
                        stopped_at = clock()
                        docker.stop(project, services)
                tags = ["--tag", f"stack:{project}"] + (["--tag", "seed"] if seed else [])
                args = ["backup", "--json", "--host", server] + tags + result.paths + [manifest_path]
                returncode, stdout, stderr = restic.run(args, None if seed else timeout_s)
                result.added_bytes = _data_added(stdout)
                if returncode == 3:
                    result.ok, result.error = False, "some files could not be read"
                elif returncode != 0:
                    result.ok, result.error = False, _last_line(stderr, f"restic exited with {returncode}")
            except StepError as error:
                result.ok, result.error = False, str(error)
            except BaseException:
                # SIGTERM or an unexpected error: after_start must not hear "ok".
                result.ok, result.error = False, result.error or "interrupted"
                raise
            finally:
                if stopped_at is not None:
                    _start_again(project, services, containers, docker, result, sleep)
                    result.downtime_s = clock() - stopped_at
        finally:
            if quieted:
                result.notes.extend(restore_monitors(quiet, tronitor, sleep=sleep))
            if not seed:
                extra = {"BACKUP_STACK": project, "BACKUP_STACK_OK": "1" if result.ok else "0"}
                _call_hook(hooks, hook, "after_start", extra, result.notes)
        return result


    def _start_again(project, services, containers, docker, result, sleep):
        """Start the services that were running. Try compose 3 times, then docker start.

        Compose waits for healthy dependencies, and a database that was just
        stopped can be slow to report healthy, so one failed start is retried.
        """
        last = None
        for attempt in range(START_TRIES):
            if attempt:
                sleep(START_WAIT_S)
            try:
                docker.start(project, services)
                return
            except StepError as error:
                last = error
        ids = [
            c["Id"]
            for c in containers
            if (c.get("State") or {}).get("Status") == "running" and c.get("Id")
        ]
        try:
            docker.start_ids(ids)
            result.notes.append(f"started with docker start after: {last}")
            return
        except StepError:
            pass
        result.ok = False
        result.still_stopped = True
        first = f"{result.error}; " if result.error else ""
        result.error = f"{first}STILL STOPPED: {last}"


    @dataclass
    class Report:
        server: str
        seed: bool = False
        started: float = 0.0
        finished: float = 0.0
        stacks: List[StackResult] = field(default_factory=list)
        unknown: List[str] = field(default_factory=list)
        errors: List[str] = field(default_factory=list)
        notes: List[str] = field(default_factory=list)
        forget_error: Optional[str] = None
        check_error: Optional[str] = None
        seeds_removed: int = 0

        @property
        def ok(self):
            return (
                not self.errors
                and not self.unknown
                and self.forget_error is None
                and self.check_error is None
                and all(stack.ok for stack in self.stacks)
            )


    COLOR_OK = 39219
    COLOR_FAILED = 16711680
    DISCORD_LIMIT = 4000
    USER_AGENT = "backup-stacks/1.0"
    PING_TRIES = 10
    NTFY_TRIES = 3
    NTFY_WAIT_S = 10
    PING_WAIT_S = 30
    HTTP_TIMEOUT_S = 10


    def human_size(n):
        """1536 -> '1.5 KiB'."""
        if n < 1024:
            return f"{n} B"
        for unit in ("KiB", "MiB", "GiB", "TiB"):
            n /= 1024
            if n < 1024 or unit == "TiB":
                return f"{n:.1f} {unit}"


    def _duration(seconds):
        seconds = int(round(seconds))
        return f"{seconds // 60}m {seconds % 60}s"


    def format_report(report):
        """The run's result as plain text: a title line, one line per stack, then details.

        It holds stack names, paths and error messages, never a URL or secret.
        """
        title = f"Backup of {report.server} {'succeeded' if report.ok else 'FAILED'}"
        lines = [title + (" (seed)" if report.seed else "")]
        for s in report.stacks:
            if not s.ok:
                lines.append(f"{s.name}: FAILED, {s.error}")
                continue
            parts = ["ok"]
            if s.downtime_s > 0:
                parts.append(f"down {_duration(s.downtime_s)}")
            elif not s.was_running:
                parts.append("was not running")
            parts.append(f"added {human_size(s.added_bytes)}")
            lines.append(f"{s.name}: {', '.join(parts)}")
        lines.append(f"Took {_duration(max(0.0, report.finished - report.started))}")
        lines.extend(f"Error: {error}" for error in report.errors)
        if report.unknown:
            lines.append(f"Unknown stacks: {', '.join(report.unknown)}")
        stopped = [s.name for s in report.stacks if s.still_stopped]
        if stopped:
            lines.append(f"Still stopped: {', '.join(stopped)}")
        missing = [f"{s.name} {' '.join(s.missing)}" for s in report.stacks if s.missing]
        if missing:
            lines.append(f"Missing paths: {'; '.join(missing)}")
        notes = [f"{s.name}: {note}" for s in report.stacks for note in s.notes] + report.notes
        if notes:
            lines.append(f"Notes: {'; '.join(notes)}")
        if report.forget_error:
            lines.append(f"restic forget: {report.forget_error}")
        if report.check_error:
            lines.append(f"restic check: {report.check_error}")
        if report.seeds_removed:
            lines.append(f"Seed snapshots removed: {report.seeds_removed}")
        skipped = [f"{s.name}: {', '.join(s.skipped)}" for s in report.stacks if s.skipped]
        if skipped:
            lines.append(f"Skipped: {'; '.join(skipped)}")
        return "\n".join(lines)


    def discord_payload(report):
        lines = format_report(report).splitlines()
        description = "\n".join(lines[1:])
        if len(description) > DISCORD_LIMIT:
            description = description[: DISCORD_LIMIT - 1] + "…"
        return {
            "embeds": [
                {"title": lines[0], "description": description, "color": COLOR_OK if report.ok else COLOR_FAILED}
            ]
        }


    def real_post(url, body, headers, timeout):
        """POST body to url. Return the HTTP status."""
        import urllib.error
        import urllib.request

        request = urllib.request.Request(url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.status
        except urllib.error.HTTPError as error:
            return error.code


    def _ok(status):
        return isinstance(status, int) and 200 <= status < 300


    class Notify:
        """Sends the report to each channel that has a URL: Discord, ntfy, Healthchecks.io.

        Nothing here can change the result of a run: every error is printed with
        the HTTP status or the error type only, never a URL or token, and then
        ignored.
        """

        def __init__(
            self, discord_url=None, ping_url=None, ntfy_url=None, ntfy_token=None, post=real_post, sleep=time.sleep
        ):
            self.discord_url = discord_url or None
            self.ping_url = ping_url.rstrip("/") if ping_url else None
            self.ntfy_url = ntfy_url or None
            self.ntfy_token = ntfy_token or None
            self.post = post
            self.sleep = sleep

        def _send(self, url, body, headers):
            try:
                return self.post(url, body, dict(headers, **{"User-Agent": USER_AGENT}), HTTP_TIMEOUT_S)
            except Exception as error:  # the network must never break the run
                return type(error).__name__

        def _send_with_retries(self, url, body, headers, tries, wait):
            status = None
            for attempt in range(tries):
                if attempt:
                    self.sleep(wait)
                status = self._send(url, body, headers)
                if _ok(status):
                    return status
            return status

        def start(self):
            if not self.ping_url:
                return
            status = self._send(self.ping_url + "/start", b"", {})
            if not _ok(status):
                print(f"could not reach Healthchecks.io for the start ping ({status})")

        def finish(self, report):
            text = format_report(report)
            if self.discord_url:
                body = json.dumps(discord_payload(report)).encode("utf-8")
                status = self._send(self.discord_url, body, {"Content-Type": "application/json"})
                if not _ok(status):
                    print(f"could not reach Discord ({status})")
            if self.ntfy_url:
                title, _, rest = text.partition("\n")
                headers = {
                    "Content-Type": "text/plain; charset=utf-8",
                    "Title": title,
                    "Priority": "default" if report.ok else "high",
                    "Tags": "white_check_mark" if report.ok else "warning",
                }
                if self.ntfy_token:
                    headers["Authorization"] = f"Bearer {self.ntfy_token}"
                status = self._send_with_retries(self.ntfy_url, (rest or title).encode("utf-8"), headers, NTFY_TRIES, NTFY_WAIT_S)
                if not _ok(status):
                    print(f"could not reach ntfy ({status})")
            if self.ping_url:
                url = self.ping_url if report.ok else self.ping_url + "/fail"
                headers = {"Content-Type": "text/plain; charset=utf-8"}
                status = self._send_with_retries(url, text.encode("utf-8"), headers, PING_TRIES, PING_WAIT_S)
                if not _ok(status):
                    print(f"could not reach Healthchecks.io ({status})")


    def take_lock(path):
        """Return an open file holding an exclusive lock on path, or None if taken."""
        import fcntl

        handle = open(path, "a+")
        try:
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            handle.close()
            return None
        return handle


    MOUNT_CHECK = 'mountpoint -q "$1" && touch "$1/.backup-stacks-probe" && rm -f "$1/.backup-stacks-probe"'


    def real_mount_ok(path, runner=subprocess.run):
        """True if path is a mount point where a test file can be written.

        The check runs in a child process under `timeout`, because even a look
        at a hung NFS mount can block, and a check that blocks would hold the run.
        """
        try:
            result = runner(["timeout", "30", "sh", "-c", MOUNT_CHECK, "sh", path], capture_output=True, timeout=40)
        except (OSError, subprocess.TimeoutExpired):
            return False
        return result.returncode == 0


    def _seed_ids(restic, server, stack):
        returncode, stdout, _err = restic.run(
            ["snapshots", "--json", "--host", server, "--tag", f"stack:{stack},seed"], DOCKER_TIMEOUT_S
        )
        if returncode != 0:
            return []
        try:
            return [snap["id"] for snap in json.loads(stdout or "[]") if snap.get("id")]
        except (ValueError, TypeError, AttributeError):
            return []


    def config_name_notes(settings, present):
        """One note per config setting that names a stack the server does not have.

        A typing mistake in exclude would otherwise stop that stack every week.
        It is a note, not an error: a stack can be gone for a while on purpose.
        """
        if not present:
            return []
        monitors = (settings.get("tronitor") or {}).get("monitors") or {}
        notes = []
        for label, wanted in (
            ("exclude", settings.get("exclude") or []),
            ("last", settings.get("last") or []),
            ("tronitor.monitors", list(monitors)),
        ):
            missing = [name for name in wanted if name not in present]
            if missing:
                notes.append(f"{label} names no stack: {', '.join(missing)}")
        return notes


    def run(
        server,
        stacks,
        *,
        seed,
        settings,
        docker,
        restic,
        tronitor,
        notify,
        manifest_dir,
        lock_path="/run/backup-stacks.lock",
        take_lock=take_lock,
        mount_ok=real_mount_ok,
        exists=os.path.exists,
        now=time.time,
        hook=run_hook,
    ):
        """Back up the stacks of one server and report. Return (exit_code, report).

        stacks is a list of project names, or None for every project.
        Exit codes: 0 all good, 1 something failed, 2 nothing was touched.
        """
        report = Report(server, seed=seed, started=now())
        host = settings.get("host") or server
        monitors = (settings.get("tronitor") or {}).get("monitors") or {}
        lock_dir = (settings.get("tronitor") or {}).get("lock_dir")
        holder = take_lock(lock_path)
        if holder is None:
            report.errors.append("another run is active")
            return 2, report
        try:
            mount = settings.get("require_mount")
            if mount and not mount_ok(mount):
                report.errors.append(f"{mount} is not mounted or not writable")
                report.finished = now()
                notify.finish(report)
                return 2, report

            hooks = settings.get("hooks") or {}
            after_run_done = []
            finished = []

            def after_run():
                if not after_run_done:
                    after_run_done.append(True)
                    ok = "1" if report.ok and finished else "0"
                    _call_hook(hooks, hook, "after_run", {"BACKUP_RUN_OK": ok}, report.notes)

            try:
                _call_hook(hooks, hook, "before_run", {}, report.notes)
                notify.start()
                returncode, _out, err = restic.run(["unlock"], DOCKER_TIMEOUT_S)
                if returncode != 0:
                    report.notes.append(f"restic unlock failed: {_last_line(err, 'no message')}")

                try:
                    present = docker.projects()
                except StepError as error:
                    report.errors.append(f"could not list stacks: {error}")
                    present = []
                if stacks is None:
                    names = [name for name in present if name not in (settings.get("exclude") or [])]
                else:
                    report.unknown = sorted(set(stacks) - set(present))
                    names = [name for name in stacks if name in present]
                report.notes.extend(config_name_notes(settings, present))

                target_dead = False
                for name in order_stacks(names, settings.get("last") or []):
                    # Once the backup target stops answering, stop no more stacks:
                    # each would wait out the time limit while it is down.
                    if not target_dead and mount and not mount_ok(mount):
                        target_dead = True
                    if target_dead:
                        report.stacks.append(StackResult(name, ok=False, error=DEAD_TARGET))
                        continue
                    try:
                        result = back_up_stack(
                            name,
                            server=host,
                            docker=docker,
                            restic=restic,
                            tronitor=tronitor,
                            monitors=monitors.get(name, []),
                            seed=seed,
                            timeout_s=int(settings.get("timeout_minutes") or 60) * 60,
                            manifest_dir=manifest_dir,
                            lock_dir=lock_dir,
                            data_roots=settings.get("data_roots") or ["/home"],
                            hooks=hooks,
                            hook=hook,
                            exists=exists,
                        )
                    except StepError as error:
                        result = StackResult(name, ok=False, error=str(error))
                    except OSError as error:
                        # The text of an OSError names a path, which can hold a
                        # test ID; report the reason only.
                        reason = error.strerror or "error"
                        result = StackResult(name, ok=False, error=f"unexpected {type(error).__name__}: {reason}")
                    except Exception as error:  # one broken stack must not stop the others
                        result = StackResult(name, ok=False, error=f"unexpected {type(error).__name__}: {error}")
                    report.stacks.append(result)
                    if (result.error or "").startswith("timed out"):
                        target_dead = True

                if not seed and target_dead:
                    report.forget_error = "skipped: backup target not answering"
                elif not seed:
                    # A restic killed at its time limit leaves a lock that would
                    # block forget and prune in this same run.
                    restic.run(["unlock"], DOCKER_TIMEOUT_S)
                    for result in report.stacks:
                        if not result.ok:
                            continue
                        ids = _seed_ids(restic, host, result.name)
                        if ids and restic.run(["forget"] + ids, DOCKER_TIMEOUT_S)[0] == 0:
                            report.seeds_removed += len(ids)
                    returncode, _out, err = restic.run(
                        forget_args(host, settings.get("retention") or {"keep_weekly": 4}), None
                    )
                    if returncode != 0:
                        report.forget_error = _last_line(err, f"restic forget exited with {returncode}")
                    returncode, _out, err = restic.run(["check"], None)
                    if returncode != 0:
                        report.check_error = _last_line(err, f"restic check exited with {returncode}")
                finished.append(True)
            except SystemExit:
                # systemctl stop, the unit's time limit or a shutdown. The stack
                # that was down has been started by its own finally; report it.
                report.errors.append("the run was stopped (SIGTERM)")
                after_run()
                report.finished = now()
                notify.finish(report)
                raise
            finally:
                after_run()
            report.finished = now()
            notify.finish(report)
            return (0 if report.ok else 1), report
        finally:
            holder.close()


    class RealParts:
        """The real Docker, restic, Tronitor, Notify and secrets file.

        main() takes another object with the same methods in tests.
        """

        config_dir = CONFIG_DIR

        def docker(self):
            return Docker()

        def secrets(self, path):
            return load_secrets(path)

        def restic(self, secrets):
            return Restic(restic_env(secrets))

        def tronitor(self, config):
            """None without a tronitor block in the config."""
            return Tronitor(config["tronitor"]["path"]) if config.get("tronitor") else None

        def notify(self, secrets):
            return Notify(
                discord_url=secrets.get("DISCORD_WEBHOOK_URL"),
                ping_url=secrets.get("HC_PING_URL"),
                ntfy_url=secrets.get("NTFY_URL"),
                ntfy_token=secrets.get("NTFY_TOKEN"),
            )

        def take_lock(self, path):
            return take_lock(path)

        def mount_ok(self, path):
            return real_mount_ok(path)

        def exists(self, path):
            return os.path.exists(path)

        def run_restic(self, secrets, args):
            """Run restic interactively with the secrets file, for init, snapshots and restores."""
            env = restic_env(secrets)
            if "RESTIC_PROGRESS_FPS" not in os.environ:
                env.pop("RESTIC_PROGRESS_FPS", None)  # a person is watching: normal progress
            return subprocess.run(["restic"] + list(args), env=env).returncode


    def _terminate(signum, frame):
        """SIGTERM from systemd: exit through the finally blocks, which start the stack again."""
        raise SystemExit(143)


    def dry_run(stacks, settings, docker, exists):
        """Print what a run would do. Return 0, or 1 if a name is unknown or a stack cannot be read."""
        code = 0
        present = docker.projects()
        excluded = [name for name in present if name in (settings.get("exclude") or [])] if stacks is None else []
        names = [name for name in present if name not in excluded] if stacks is None else [name for name in stacks if name in present]
        unknown = [] if stacks is None else sorted(set(stacks) - set(present))
        ordered = order_stacks(names, settings.get("last") or [])
        print(f"Order: {', '.join(ordered) or '-'}")
        for note in config_name_notes(settings, present):
            print(f"Note: {note}")
        if excluded:
            print(f"Excluded: {', '.join(excluded)}")
        for name in ordered:
            print(name)
            try:
                containers = docker.containers(name)
            except StepError as error:
                print(f"  error: {error}")
                code = 1
                continue
            paths, skipped = select_paths(containers, settings.get("data_roots") or ["/home"])
            present_paths, missing = existing_paths(paths, exists=exists)
            print(f"  running: {', '.join(running_services(containers)) or '-'}")
            print(f"  paths: {', '.join(present_paths) or '-'}")
            print(f"  missing: {', '.join(missing) or '-'}")
            print(f"  skipped: {', '.join(skipped) or '-'}")
            monitors = ((settings.get("tronitor") or {}).get("monitors") or {}).get(name, [])
            print(f"  monitors: {', '.join(monitors) or '-'}")
        if unknown:
            print(f"Unknown stacks: {', '.join(unknown)}")
            code = 1
        return code


    def _parser():
        parser = argparse.ArgumentParser(
            prog="backup_stacks.py",
            description="Back up the Compose stacks of one server with restic, one stopped stack at a time.",
        )
        parser.add_argument("server", nargs="?", metavar="NAME", help="the config /etc/backup-stacks/NAME.json")
        parser.add_argument("--config", metavar="PATH", help="a config file elsewhere, instead of NAME")
        parser.add_argument("stacks", nargs="*", metavar="STACK", help="Compose project names to back up")
        parser.add_argument("--all", action="store_true", help="back up every Compose project on the server")
        parser.add_argument(
            "--seed", action="store_true", help="first snapshot without stopping the stacks (never for a restore)"
        )
        parser.add_argument(
            "--dry-run", action="store_true", help="print what a run would do; stop nothing, run no restic"
        )
        parser.add_argument(
            "--restic",
            nargs=argparse.REMAINDER,
            metavar="ARGS",
            help="run restic ARGS with the secrets file, for example: --restic snapshots",
        )
        return parser


    def _config_path(args, parts):
        """Return (name, path, stacks) from NAME or --config.

        With --config, the first word after the options is a stack name, not NAME.
        """
        stacks = list(args.stacks)
        if args.config:
            if args.server:
                stacks.insert(0, args.server)
            name = os.path.splitext(os.path.basename(args.config))[0]
            return name, args.config, stacks
        if not args.server:
            raise UsageError("give a config NAME or --config PATH")
        if not NAME.fullmatch(args.server):
            raise UsageError("give one config name of letters, digits, - and _")
        return args.server, os.path.join(parts.config_dir, f"{args.server}.json"), stacks


    def main(argv=None, parts=None):
        argv = sys.argv[1:] if argv is None else argv
        parser = _parser()
        try:
            args = parser.parse_args(argv)
        except SystemExit as stop:
            return stop.code if isinstance(stop.code, int) else 2
        parts = parts or RealParts()
        signal.signal(signal.SIGTERM, _terminate)
        try:
            name, path, names = _config_path(args, parts)
            if args.restic is not None:
                if args.all or names or args.seed or args.dry_run:
                    raise UsageError("--restic cannot be combined with --all, stack names, --seed or --dry-run")
                if not args.restic:
                    raise UsageError("give restic arguments after --restic, for example: --restic snapshots")
                config = load_config(path, name)
                return parts.run_restic(parts.secrets(config["secrets_file"]), args.restic)
            if args.all == bool(names):
                raise UsageError("give --all or one or more stack names, not both")
            bad = [stack for stack in names if not NAME.fullmatch(stack)]
            if bad:
                raise UsageError(f"not a stack name: {bad[0]}")
            config = load_config(path, name)
            stacks = None if args.all else names
            if args.dry_run:
                return dry_run(stacks, config, parts.docker(), parts.exists)
            secrets = parts.secrets(config["secrets_file"])
        except UsageError as error:
            sys.stderr.write(parser.format_usage())
            print(f"error: {error}", file=sys.stderr)
            return 2
        lock_dir = (config.get("tronitor") or {}).get("lock_dir")
        if lock_dir:
            os.makedirs(lock_dir, exist_ok=True)
        code, report = run(
            name,
            stacks,
            seed=args.seed,
            settings=config,
            docker=parts.docker(),
            restic=parts.restic(secrets),
            tronitor=parts.tronitor(config),
            notify=parts.notify(secrets),
            manifest_dir=config["manifest_dir"],
            lock_path=config["lock_path"],
            take_lock=parts.take_lock,
            mount_ok=parts.mount_ok,
            exists=parts.exists,
        )
        print(format_report(report))
        return code


    if __name__ == "__main__":
        sys.exit(main())
    ```

## The stack map and the pins

`split_stacks.py` reads two files for each server. [Move the stacks](move-stacks.md#write-the-stack-map) explains each key of the map, and [Back up and record](backup.md#pin-the-images) explains how to write the pins.

??? example "tools/stacks/server-a.json"

    ```json
    {
      "stacks": {
        "proxy": ["swag"],
        "media": ["sonarr", "sonarr-db", "radarr"],
        "monitoring": ["uptime-kuma"]
      },
      "skip": ["komodo-core", "komodo-mongo", "komodo-periphery"],
      "secret_keys": ["DB_PASSWORD", "POSTGRES_PASSWORD", "POSTGRES_USER", "API_TOKEN"],
      "secret_flags": ["--requirepass"],
      "scan_exempt_keys": ["POSTGRES_USER"],
      "plain_env": {"TZ": "Etc/UTC", "PUID": "1000", "PGID": "1000"},
      "network": {"key": "lab.docker", "name": "home_lab.docker"},
      "komodo_files": ["komodo/docker-compose.yml"]
    }
    ```

??? example "tools/pins/server-a.json"

    ```json
    {
      "swag": "lscr.io/linuxserver/swag:5.9.0-ls497@sha256:<digest>",
      "sonarr": "lscr.io/linuxserver/sonarr:4.0.15.2941-ls292@sha256:<digest>",
      "sonarr-db": "postgres:15-alpine@sha256:<digest>",
      "radarr": "lscr.io/linuxserver/radarr:5.26.2.10099-ls276@sha256:<digest>",
      "uptime-kuma": "louislam/uptime-kuma:1@sha256:<digest>"
    }
    ```

## The backup config and units

`backup_stacks.py` reads one config for each server. [Weekly backups](backups.md#the-config) explains each key, with Tronitor and hooks. This example backs up the stacks of `server-a` to an NFS share.
??? example "tools/backup/server-a.json"

    ```json
    {
      "host": "server-a",
      "data_roots": ["/home"],
      "require_mount": "/mnt/backup",
      "last": ["komodo", "monitoring", "proxy"],
      "timeout_minutes": 60,
      "retention": {"keep_weekly": 4}
    }
    ```

The service is the same for every server: `%i` is the name of the config. Its stop settings let the script start the stack that is down and send its report when the run is stopped.

??? example "tools/systemd/backup-stacks@.service"

    ```ini
    [Unit]
    Description=Weekly restic backup of the Compose stacks of %i (/etc/backup-stacks/%i.json)
    Documentation=file:///usr/local/sbin/backup_stacks.py
    Wants=network-online.target
    After=network-online.target docker.service

    [Service]
    Type=oneshot
    # restic keeps its cache in $HOME/.cache/restic. systemd sets no HOME for
    # root units, and without the cache every run downloads the index again.
    Environment=HOME=/root
    # A catch-up run right after a boot waits until the server has been up for
    # 10 minutes, so that the containers have finished starting.
    ExecStartPre=/bin/sh -c 'up=$$(cut -d. -f1 /proc/uptime); if [ "$$up" -lt 600 ]; then sleep $$((600 - up)); fi'
    ExecStart=/usr/bin/python3 -I /usr/local/sbin/backup_stacks.py %i --all
    TimeoutStartSec=12h
    # On stop, SIGTERM goes to Python only. It then starts the stack that is
    # down, restores the tests and sends the report before systemd kills the rest.
    KillMode=mixed
    TimeoutStopSec=15min
    Nice=10
    IOSchedulingClass=idle
    ```

One timer for each server. It uses the server's time zone; to fix one, write it after the time, for example `03:00:00 Etc/UTC`.

??? example "tools/systemd/backup-stacks-server-a.timer"

    ```ini
    [Unit]
    Description=Weekly restic backup of the Compose stacks of server-a

    [Timer]
    OnCalendar=Sun *-*-* 03:00:00
    Persistent=true
    Unit=backup-stacks@server-a.service

    [Install]
    WantedBy=timers.target
    ```

## Configuration files

These files hold values of your homelab, so they show placeholders. Replace each one with your own value. The Renovate files are on the [Renovate](renovate.md) page.

Keeps secrets files and working files out of Git.

??? example ".gitignore"

    ```text
    # Secrets and working files must never reach Git.
    *.env
    secrets-*
    work/

    __pycache__/
    *.pyc
    ```

Komodo Core, Mongo and the Periphery of `server-a`. Replace `<komodo-host>` with your host name, and set `TZ` to your time zone.

??? example "komodo/docker-compose.yml"

    ```yaml
    name: komodo

    # Start this project by hand. Komodo never manages it.
    #
    #   docker compose -f komodo/docker-compose.yml \
    #     --env-file /home/.env_files/.komodo.env up -d

    services:
      mongo:
        container_name: komodo-mongo
        image: mongo:8.0.34@sha256:b9924c330a8bbc5800fe9c69f04a84e221eca7b28fd049a0354147d9908fa142
        labels:
          komodo.skip: # Prevent Komodo from stopping with StopAllContainers
        command: --quiet --wiredTigerCacheSizeGB 0.25
        restart: unless-stopped
        environment:
          MONGO_INITDB_ROOT_USERNAME: ${KOMODO_DATABASE_USERNAME}
          MONGO_INITDB_ROOT_PASSWORD: ${KOMODO_DATABASE_PASSWORD}
        volumes:
          - /home/komodo/mongo/db:/data/db
          - /home/komodo/mongo/config:/data/configdb

      core:
        container_name: komodo-core
        image: ghcr.io/moghtech/komodo-core:2.3.4@sha256:91b2afd7b3bb2abea0ebd3046d65ec457eb1f3d505868d1d60cb0f8562490ef9
        labels:
          komodo.skip: # Prevent Komodo from stopping with StopAllContainers
        init: true
        restart: unless-stopped
        depends_on:
          - mongo
        ports:
          - 9120:9120
        env_file:
          - /home/.env_files/.komodo.env
        environment:
          TZ: Etc/UTC
          KOMODO_DATABASE_ADDRESS: mongo:27017
          KOMODO_HOST: https://<komodo-host>
          KOMODO_TITLE: Komodo
          KOMODO_FIRST_SERVER_NAME: server-a
          KOMODO_PERIPHERY_PUBLIC_KEY: file:/config/keys/periphery.pub
          KOMODO_LOCAL_AUTH: "true"
          KOMODO_DISABLE_USER_REGISTRATION: "true"
        volumes:
          - /home/komodo/keys:/config/keys
          - /home/komodo/backups:/backups

      periphery:
        container_name: komodo-periphery
        image: ghcr.io/moghtech/komodo-periphery:2.3.4@sha256:fb4b52961fcce7a31e3776930e422967b6640f653de876f59f26dea243e29beb
        labels:
          komodo.skip: # Prevent Komodo from stopping with StopAllContainers
        init: true
        restart: unless-stopped
        depends_on:
          - core
        environment:
          TZ: Etc/UTC
          PERIPHERY_CORE_ADDRESS: ws://core:9120
          PERIPHERY_CONNECT_AS: server-a
          PERIPHERY_CORE_PUBLIC_KEYS: file:/config/keys/core.pub
          PERIPHERY_ROOT_DIRECTORY: /home/komodo/periphery
          PERIPHERY_INCLUDE_DISK_MOUNTS: /etc/hostname
        volumes:
          - /home/komodo/keys:/config/keys
          - /var/run/docker.sock:/var/run/docker.sock
          - /proc:/proc
          # The root directory must have the same path inside and outside.
          - /home/komodo/periphery:/home/komodo/periphery
          # Compose runs in this container, so stacks read env files here.
          - /home/.env_files:/home/.env_files:ro
    ```

The names of the Komodo env file, without values.

??? example "komodo/compose.env.example"

    ```text
    # Names only. The real file is /home/.env_files/.komodo.env on server-a.
    # Never commit real values.
    KOMODO_DATABASE_USERNAME=
    KOMODO_DATABASE_PASSWORD=
    KOMODO_INIT_ADMIN_USERNAME=
    KOMODO_INIT_ADMIN_PASSWORD=
    KOMODO_WEBHOOK_SECRET=
    KOMODO_JWT_SECRET=
    ```

The Periphery of `server-b`, which connects out to Core through the restricted route.

??? example "komodo/periphery-server-b/docker-compose.yml"

    ```yaml
    name: komodo-periphery

    # Start this project by hand on server-b. Komodo never manages it.
    #
    #   docker compose -f komodo/periphery-server-b/docker-compose.yml up -d

    services:
      periphery:
        container_name: komodo-periphery
        image: ghcr.io/moghtech/komodo-periphery:2.3.4@sha256:fb4b52961fcce7a31e3776930e422967b6640f653de876f59f26dea243e29beb
        labels:
          komodo.skip: # Prevent Komodo from stopping with StopAllContainers
        init: true
        restart: unless-stopped
        # Holds the onboarding key for the first connection only.
        env_file:
          - /home/.env_files/.komodo-periphery.env
        environment:
          TZ: Etc/UTC
          PERIPHERY_CORE_ADDRESS: https://<komodo-host>
          PERIPHERY_CONNECT_AS: server-b
          PERIPHERY_CORE_PUBLIC_KEYS: file:/config/keys/core.pub
          PERIPHERY_ROOT_DIRECTORY: /home/komodo/periphery
          PERIPHERY_INCLUDE_DISK_MOUNTS: /etc/hostname
        volumes:
          - /home/komodo/keys:/config/keys
          - /var/run/docker.sock:/var/run/docker.sock
          - /proc:/proc
          # The root directory must have the same path inside and outside.
          - /home/komodo/periphery:/home/komodo/periphery
          # Compose runs in this container, so stacks read env files here.
          - /home/.env_files:/home/.env_files:ro
    ```

The restricted route on `server-a`. Replace the placeholders with your values.

??? example "komodo/swag/komodo.subdomain.conf"

    ```nginx
    ## Komodo restricted route. Copy to /home/swag/config/nginx/proxy-confs/ on server-a.
    ##
    ## server-b can reach Core on two paths only. The web interface is open to
    ## the LAN only, over HTTPS here or over HTTP at http://<server-a-lan-ip>:9120.

    server {
        listen 443 ssl;
        listen [::]:443 ssl;

        server_name komodo.*;

        include /config/nginx/ssl.conf;

        # The web interface, for the LAN only. A LAN request comes back in
        # through the router, so SWAG sees the LAN address of the router.
        # Requests from the internet keep their own address and are denied.
        location / {
            allow <lan-subnet>;
            deny all;

            proxy_pass http://<server-a-lan-ip>:9120;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_read_timeout 1h;
        }

        # Forgejo webhooks.
        location /listener/ {
            allow <server-b-public-ip>;
            deny all;

            proxy_pass http://<server-a-lan-ip>:9120;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }

        # Periphery on server-b. The exact match keeps /ws/update and
        # /ws/terminal blocked. Core checks the host name during login.
        location = /ws/periphery {
            allow <server-b-public-ip>;
            deny all;

            proxy_pass http://<server-a-lan-ip>:9120;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_read_timeout 1h;
        }
    }
    ```
