#!/usr/bin/python

import urllib2
import json
import subprocess
import sys
import os
import argparse
import codecs
import re

BASE_URL = 'https://api.github.com/repos/AdguardTeam/'
BRANCH_REGEX = r'(fix|bug|feature)(\/issues)?\/([0-9]+)[_-]?(.*)'

ISSUE_TYPES = {
    'feature' : 'Feature',
    'fix' : 'Fix',
    'bug' : 'Fix'
}

def get_args():
    """Parses, validates and returns arguments, passed to the script"""
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', dest='repo', action='store')
    parser.add_argument('--after_date', dest='after_date', action='store')
    parser.add_argument('--output', dest='output', action='store')
    parser.add_argument('--token', dest='token', action='store')
    args = parser.parse_args()
    if not args.repo:
        print 'Repo is not specified'
        sys.exit(1)

    if not args.after_date:
        print 'After date is not specified'
        sys.exit(1)

    if not args.output:
        print 'Output path is not specified'
        sys.exit(1)

    if not args.token:
        print 'Github token is not specified'
        sys.exit(1)

    print 'Args are: %s' %args
    return args

def get_gh_issue_summary(branch_name_parts, repo, token):
    """Gets short summary for the specified branch_id, which is related to the github issue from the specified repo"""
    issue_url = BASE_URL + repo + "/issues/" + branch_name_parts.group(3)
    req = urllib2.Request(
            url=issue_url,
            headers={
                'User-Agent' : "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
                'Authorization' : 'token ' + token
            }
        )
    response = urllib2.urlopen(req)
    issue = json.loads(response.read())
    issue_type = ISSUE_TYPES.get(branch_name_parts.group(1), 'Fix')
    patch_name = branch_name_parts.group(4)

    text = '* [%s%s] %s: #%s\r\n' %(
        issue_type,
        '(regression)' if patch_name != '' else '',
        issue["title"],
        issue["number"]
    )
    return text

if __name__ == '__main__':
    print "The nightly notes collecting started"
    args = get_args()
    merged_branches = subprocess.check_output('git log --oneline --grep="to master" --fixed-strings --reverse --after=' + args.after_date, shell=True)
    print "Merged branches are:\n%s" %(merged_branches)

    data = ""
    summaries =[]
    branch_pattern = re.compile(BRANCH_REGEX)
    for line in merged_branches.splitlines():
        begin_string = " from "
        end_string = " to master"
        pos = line.find(begin_string) + len(begin_string)
        pos2 = line.find(end_string)
        branch_name = line[pos : pos2]

        branch_name_parts = branch_pattern.search(branch_name)
        if branch_name_parts:
            if not unicode(branch_name_parts.group(3), 'utf-8').isnumeric():
                continue
            
            summary = get_gh_issue_summary(branch_name_parts, args.repo, args.token)
            summaries.append(summary)

    summaries.sort(reverse=False)
    data+= "".join(summaries)
    if os.path.exists(args.output) and os.path.isfile(args.output):
        os.remove(args.output)
    with codecs.open(args.output, "wb", encoding='utf-8') as f_out:
        f_out.write(data)

    print "The changelog has been successfully collected"
    print data
